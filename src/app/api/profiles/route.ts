import {NextResponse} from 'next/server';
import {admin,authenticated} from '../../../lib/supabase';
import {normalizeProfile,SourceError} from '../../../lib/profile';
export async function POST(req:Request){try{
 const user=await authenticated(req);if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});
 const body=await req.json();const url=normalizeProfile(body.url);
 const db=admin();const {data,error}=await db.rpc('link_profile',{p_profile_url:url,p_user_id:user.id});
 if(error)throw error;return NextResponse.json({profile_id:data,ownership:'unverified',message:'Public profile linked for observation. This does not verify ownership.'},{status:202});
 }catch(e){return NextResponse.json({error:e instanceof SourceError?e.message:'Unable to link profile.'},{status:e instanceof SourceError?400:503});}}
export async function GET(req:Request){try{
 const user=await authenticated(req);if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});
 const db=admin();const {data:link,error}=await db.from('profile_links').select('profile_id').eq('user_id',user.id).maybeSingle();if(error)throw error;
 if(!link)return NextResponse.json({profile:null});
 const {data:profile,error:pError}=await db.from('external_profiles').select('id,profile_url,display_name,last_success_at,last_error,snapshot').eq('id',link.profile_id).single();if(pError)throw pError;
 // Queue refresh before returning stale data; persisted queue survives request completion.
 const {error:qError}=await db.rpc('enqueue_profile',{target_profile:link.profile_id});if(qError)throw qError;
 return NextResponse.json({profile,stale:!profile.last_success_at||Date.now()-Date.parse(profile.last_success_at)>6*3600_000},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'Supabase is unavailable or not configured.'},{status:503});}}
