import 'server-only';
import { createClient } from '@supabase/supabase-js';
export function admin(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) throw new Error('Supabase server configuration is missing.');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function authenticated(request:Request){
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return null;
 const {data,error}=await admin().auth.getUser(token);return error?null:data.user;
}
