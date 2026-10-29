import {timingSafeEqual} from 'node:crypto';
import {runBatch} from '../../../../lib/sync';
import {NextResponse} from 'next/server';
export const maxDuration=60;
export async function POST(req:Request){
 const expected=process.env.CRON_SECRET;const actual=req.headers.get('authorization')??'';
 if(!expected||Buffer.byteLength(actual)!==Buffer.byteLength(`Bearer ${expected}`)||!timingSafeEqual(Buffer.from(actual),Buffer.from(`Bearer ${expected}`)))return NextResponse.json({error:'Unauthorized'},{status:401});
 try{return NextResponse.json({results:await runBatch()});}catch{return NextResponse.json({error:'Worker unavailable; check server configuration.'},{status:503});}
}
