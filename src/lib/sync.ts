import {admin} from './supabase';
import {fetchProfile} from './profile';
export async function runBatch(){
 if(process.env.ENABLE_PUBLIC_HTML_INGESTION!=='true')throw new Error('Public HTML ingestion is disabled.');
 const db=admin();const {data:jobs,error}=await db.rpc('claim_sync_jobs',{batch_size:3});if(error)throw error;
 const results=[];
 for(const job of jobs??[]){try{
 const snapshot=await fetchProfile(job.profile_url);
 const {error}=await db.rpc('complete_profile_sync',{job_id:job.id,lease_token:job.lease_token,p_snapshot:snapshot});if(error)throw error;
 results.push({id:job.id,status:'success'});
 }catch(e){const message=e instanceof Error?e.message:'Sync failed';const {error}=await db.rpc('fail_profile_sync',{job_id:job.id,lease_token:job.lease_token,error_message:message});if(error)throw error;results.push({id:job.id,status:'retry',error:message});}}
 return results;
}
