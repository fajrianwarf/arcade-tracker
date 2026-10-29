import {admin} from '../../../lib/supabase';
import {NextResponse} from 'next/server';
export async function GET(){try{const {data,error}=await admin().from('activities').select('id,title,kind,source_url,verified_at').eq('published',true).order('title');if(error)throw error;return NextResponse.json({items:data},{headers:{'Cache-Control':'public, s-maxage=300, stale-while-revalidate=3600'}});}catch{return NextResponse.json({items:[],error:'Catalog requires configured Supabase.'},{status:503});}}
