// Optional Edge gateway: set SYNC_URL and TRACKER_CRON_SECRET using Supabase secrets.
// Keep JWT verification enabled. Invoke via a privileged server or Vault-backed Cron.
Deno.serve(async (req:Request)=>{
 if(req.method!=='POST')return new Response('Method not allowed',{status:405});
 const url=Deno.env.get('SYNC_URL'),secret=Deno.env.get('TRACKER_CRON_SECRET');
 if(!url||!secret)return new Response('Missing configuration',{status:503});
 const res=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${secret}`},signal:AbortSignal.timeout(60000)});
 return new Response(await res.text(),{status:res.status,headers:{'Content-Type':'application/json'}});
});
