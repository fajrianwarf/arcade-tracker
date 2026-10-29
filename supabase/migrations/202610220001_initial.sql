-- gen_random_uuid and sha256 are built-in PostgreSQL functions.
create table public.activities (
 id uuid primary key default gen_random_uuid(), source_url text unique not null,
 title text not null, kind text not null check(kind in ('game','skill_badge','other')),
 published boolean not null default false, verified_at timestamptz,
 available_from timestamptz, available_until timestamptz, metadata jsonb not null default '{}',
 created_at timestamptz not null default now(), check(not published or verified_at is not null)
);
create table public.external_profiles (
 id uuid primary key default gen_random_uuid(),profile_url text unique not null,
 display_name text,snapshot jsonb,last_success_at timestamptz,last_error text,
 next_sync_at timestamptz not null default now(), created_at timestamptz not null default now(),
 check(profile_url ~ '^https://www.skills.google/public_profiles/[a-f0-9-]{36}$')
);
-- A link is an observation subscription, never proof of Google account ownership.
create table public.profile_links (
 user_id uuid primary key references auth.users on delete cascade,
 profile_id uuid not null references public.external_profiles on delete cascade,
 leaderboard_opt_in boolean not null default false,alias text not null default 'Learner',
 ownership_status text not null default 'unverified' check(ownership_status='unverified'),
 check(char_length(alias) between 1 and 40)
);
create table public.earned_badges (
 profile_id uuid not null references public.external_profiles on delete cascade,
 external_id text not null,title text not null,earned_on date,earned_label text not null,
 credential_url text not null,activity_id uuid references public.activities,
 activity_url text,first_seen_at timestamptz not null default now(),last_seen_at timestamptz not null default now(),
 primary key(profile_id,external_id)
);
create table public.rule_versions (
 id uuid primary key default gen_random_uuid(),name text not null,version integer not null,
 starts_on date not null,ends_on date not null,source_url text not null,verified_at timestamptz,
 skill_group_size integer not null check(skill_group_size>0),skill_group_points integer not null check(skill_group_points>=0),game_points integer not null check(game_points>=0),
 published boolean not null default false,unique(name,version),check(ends_on>=starts_on),check(not published or verified_at is not null)
);
create table public.score_snapshots (
 profile_id uuid references public.external_profiles on delete cascade,
 rule_version_id uuid references public.rule_versions,points integer not null check(points>=0),
 breakdown jsonb not null,computed_at timestamptz not null default now(),primary key(profile_id,rule_version_id)
);
create table public.sync_jobs (
 id uuid primary key default gen_random_uuid(),profile_id uuid not null references public.external_profiles on delete cascade,
 status text not null default 'queued' check(status in ('queued','running','succeeded','failed')),
 attempts integer not null default 0,available_at timestamptz not null default now(),
 lease_until timestamptz,lease_token uuid,error text,created_at timestamptz not null default now(),completed_at timestamptz
);
create unique index one_active_profile_job on public.sync_jobs(profile_id) where status in ('queued','running');
create index sync_due on public.sync_jobs(available_at) where status='queued';
create table public.source_observations (
 id bigint generated always as identity primary key,profile_id uuid references public.external_profiles on delete cascade,
 job_id uuid references public.sync_jobs on delete set null,adapter_version text not null,content_hash text not null,
 observed_awards integer not null,coverage text not null,observed_at timestamptz not null default now()
);
-- No raw source HTML retained. Jobs and evidence remain server-only.
alter table public.activities enable row level security;
alter table public.external_profiles enable row level security;
alter table public.profile_links enable row level security;
alter table public.earned_badges enable row level security;
alter table public.rule_versions enable row level security;
alter table public.score_snapshots enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.source_observations enable row level security;
create policy catalog_read on public.activities for select using(published);
create policy rules_read on public.rule_versions for select using(published);
create policy link_read on public.profile_links for select to authenticated using(user_id=auth.uid());
-- Only preference fields may be directly changed; profile changes use the rate-limited RPC.
create policy link_preferences on public.profile_links for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
revoke all on public.profile_links from anon,authenticated;
grant select on public.profile_links to authenticated;
grant update(leaderboard_opt_in,alias) on public.profile_links to authenticated;
create policy own_profile on public.external_profiles for select to authenticated using(exists(select 1 from public.profile_links l where l.profile_id=id and l.user_id=auth.uid()));
create policy own_badges on public.earned_badges for select to authenticated using(exists(select 1 from public.profile_links l where l.profile_id=earned_badges.profile_id and l.user_id=auth.uid()));
create policy own_scores on public.score_snapshots for select to authenticated using(exists(select 1 from public.profile_links l where l.profile_id=score_snapshots.profile_id and l.user_id=auth.uid()));
create function public.enqueue_profile(target_profile uuid) returns void language plpgsql security definer set search_path=public as $$
begin
 insert into sync_jobs(profile_id)
 select id from external_profiles where id=target_profile and next_sync_at<=now()
 on conflict(profile_id) where status in ('queued','running') do nothing;
end $$;
create function public.link_profile(p_profile_url text,p_user_id uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare target uuid; current_profile uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 select profile_id into current_profile from profile_links l where l.user_id=p_user_id;
 if current_profile is not null and exists(select 1 from external_profiles p where p.id=current_profile and p.profile_url<>p_profile_url) then
  raise exception 'One profile per account in MVP; unlinking requires account support';
 end if;
 insert into external_profiles(profile_url) values(p_profile_url) on conflict(profile_url) do update set profile_url=excluded.profile_url returning id into target;
 insert into profile_links(user_id,profile_id) values(p_user_id,target) on conflict(user_id) do nothing;
 perform enqueue_profile(target);return target;
end $$;
create function public.claim_sync_jobs(batch_size integer default 3) returns table(id uuid,profile_url text,lease_token uuid) language plpgsql security definer set search_path=public as $$
begin
 -- Recover abandoned workers; a fencing token prevents late workers committing.
 update sync_jobs set status=case when attempts>=5 then 'failed' else 'queued' end,available_at=now(),lease_until=null where status='running' and lease_until<now();
 return query with candidates as (
 select j.id from sync_jobs j where j.status='queued' and j.available_at<=now() order by j.available_at for update skip locked limit least(greatest(batch_size,1),3)
 ), claimed as (
 update sync_jobs j set status='running',attempts=j.attempts+1,lease_until=now()+interval '5 minutes',lease_token=gen_random_uuid() from candidates c where j.id=c.id returning j.id,j.profile_id,j.lease_token
 ) select c.id,p.profile_url,c.lease_token from claimed c join external_profiles p on p.id=c.profile_id;
end $$;
create function public.complete_profile_sync(job_id uuid,lease_token uuid,p_snapshot jsonb) returns void language plpgsql security definer set search_path=public as $$
declare target uuid; award jsonb;
begin
 select profile_id into target from sync_jobs j where j.id=job_id and j.status='running' and j.lease_token=complete_profile_sync.lease_token and j.lease_until>now() for update;
 if target is null then raise exception 'Expired lease';end if;
 if p_snapshot->>'url'<>(select profile_url from external_profiles where id=target) then raise exception 'Profile mismatch';end if;
 for award in select * from jsonb_array_elements(p_snapshot->'awards') loop
 insert into earned_badges(profile_id,external_id,title,earned_on,earned_label,credential_url,activity_url,activity_id)
 values(target,award->>'external_id',award->>'title',(award->>'earned_on')::date,award->>'earned_label',award->>'credential_url',award->>'activity_url',(select id from activities where source_url=award->>'activity_url' and published))
 on conflict(profile_id,external_id) do update set title=excluded.title,earned_on=excluded.earned_on,earned_label=excluded.earned_label,activity_url=excluded.activity_url,activity_id=excluded.activity_id,last_seen_at=now();
 end loop;
 update external_profiles set display_name=p_snapshot->>'display_name',snapshot=p_snapshot,last_success_at=now(),last_error=null,next_sync_at=now()+interval '6 hours' where id=target;
 insert into source_observations(profile_id,job_id,adapter_version,content_hash,observed_awards,coverage)
 values(target,job_id,p_snapshot->>'adapter_version',encode(sha256(convert_to((p_snapshot->'awards')::text,'UTF8')),'hex'),jsonb_array_length(p_snapshot->'awards'),p_snapshot->>'coverage');
 update sync_jobs set status='succeeded',completed_at=now(),lease_until=null where id=job_id;
end $$;
create function public.fail_profile_sync(job_id uuid,lease_token uuid,error_message text) returns void language plpgsql security definer set search_path=public as $$
declare target uuid;
begin
 update sync_jobs j set status=case when attempts>=5 then 'failed' else 'queued' end,
 available_at=now()+make_interval(secs=>least(86400,(300*power(2,attempts))::integer)),error=left(error_message,500),lease_until=null
 where j.id=job_id and j.status='running' and j.lease_token=fail_profile_sync.lease_token and j.lease_until>now() returning profile_id into target;
 update external_profiles set last_error=left(error_message,500),next_sync_at=now()+interval '24 hours' where id=target;
end $$;
create function public.enqueue_due_profiles() returns void language sql security definer set search_path=public as $$
 insert into sync_jobs(profile_id) select p.id from external_profiles p where p.next_sync_at<=now() and exists(select 1 from profile_links l where l.profile_id=p.id)
 on conflict(profile_id) where status in ('queued','running') do nothing;
$$;
create function public.community_leaderboard() returns table(alias text,badges bigint,last_success_at timestamptz) language sql security definer set search_path=public as $$
 select min(l.alias),jsonb_array_length(p.snapshot->'awards')::bigint,p.last_success_at from profile_links l join external_profiles p on p.id=l.profile_id
 where l.leaderboard_opt_in and p.last_success_at>now()-interval '7 days' and p.last_error is null
 group by p.id order by jsonb_array_length(p.snapshot->'awards') desc,p.id limit 100;
$$;
-- Explicit RPC boundaries: all worker and link functions are service-role only.
revoke execute on function public.enqueue_profile(uuid),public.link_profile(text,uuid),public.claim_sync_jobs(integer),public.complete_profile_sync(uuid,uuid,jsonb),public.fail_profile_sync(uuid,uuid,text),public.enqueue_due_profiles() from public,anon,authenticated;
grant execute on function public.enqueue_profile(uuid),public.link_profile(text,uuid),public.claim_sync_jobs(integer),public.complete_profile_sync(uuid,uuid,jsonb),public.fail_profile_sync(uuid,uuid,text),public.enqueue_due_profiles() to service_role;
revoke execute on function public.community_leaderboard() from public;
grant execute on function public.community_leaderboard() to anon,authenticated,service_role;
