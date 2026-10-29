-- Apply after migration. Enable pg_cron, pg_net and Vault in Supabase first.
-- Add Vault secrets through Dashboard: tracker_sync_url (https://YOUR-VERCEL/api/cron/sync), tracker_cron_secret.
-- One scheduler only. SQL queues verification; Edge Function forwards worker calls.
select cron.schedule('arcade-enqueue-due','17 */6 * * *',$$select public.enqueue_due_profiles();$$);
select cron.schedule('arcade-worker','23 * * * *',$$
 select net.http_post(
 url := (select decrypted_secret from vault.decrypted_secrets where name='tracker_sync_url'),
 headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='tracker_cron_secret')),
 body := '{}'::jsonb, timeout_milliseconds := 60000
 );
$$);
-- Weekly retention; successful job evidence retained separately.
select cron.schedule('arcade-retention','37 2 * * 0',$$
 delete from public.source_observations where observed_at<now()-interval '30 days';
 delete from public.sync_jobs where status in ('succeeded','failed') and created_at<now()-interval '14 days';
 delete from public.external_profiles p where not exists(select 1 from public.profile_links l where l.profile_id=p.id) and p.created_at<now()-interval '7 days';
$$);
