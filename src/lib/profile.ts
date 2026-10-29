import * as cheerio from 'cheerio';
export const ADAPTER_VERSION = 'google-public-html/v1';
import {normalizeProfile,SourceError} from './profile-url';
export {normalizeProfile,SourceError} from './profile-url';
export type Award={external_id:string;title:string;earned_on:string|null;earned_label:string;credential_url:string;activity_url:string|null};
export type ProfileSnapshot={url:string;display_name:string;awards:Award[];fetched_at:string;adapter_version:string;coverage:'visible_page_only';warnings:string[]};
export function parseProfile(html:string,url:string):ProfileSnapshot {
 url=normalizeProfile(url); const $=cheerio.load(html);
 const name=$('main h1').first().text().trim();
 if(!name||!$('.profile-badges').length) throw new SourceError('unrecognized_html','Profile is private, unavailable, or Google changed the page. Existing data was preserved.');
 const awards:Award[]=[];const ids=new Set<string>();
 $('.profile-badge').each((_,el)=>{
  const card=$(el);const href=card.find('a.badge-image').attr('href');
  const title=card.find('.ql-title-medium').text().trim();
  if(!href||!title) throw new SourceError('schema_changed','An award is missing its title or credential URL.');
  const credential=new URL(href,url); const id=credential.pathname.match(/\/badges\/(\d+)$/)?.[1];
  if(credential.origin!==new URL(url).origin||!credential.pathname.startsWith(new URL(url).pathname+'/badges/')||!id) throw new SourceError('schema_changed','Unexpected credential URL.');
  const label=card.find('.ql-body-medium').text().trim();
  const date=label.match(/Earned\s+([A-Z][a-z]{2})\s+(\d{1,2}),\s+(\d{4})/);
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const earned=date&&months.includes(date[1])?`${date[3]}-${String(months.indexOf(date[1])+1).padStart(2,'0')}-${date[2].padStart(2,'0')}`:null;
  const modal=card.find('ql-button[modal]').attr('modal');
  const link=modal?$(`[id="${modal}"] ql-button[href]`).attr('href'):undefined;
  let activity:string|null=null;
  if(link){const u=new URL(link,url);if(u.origin===new URL(url).origin&&/^\/(course_templates|games|quests)\//.test(u.pathname))activity=u.origin+u.pathname;}
  if(!ids.has(id)){ids.add(id);awards.push({external_id:id,title,earned_on:earned,earned_label:label,credential_url:credential.href,activity_url:activity});}
 });
 return {url,display_name:name,awards,fetched_at:new Date().toISOString(),adapter_version:ADAPTER_VERSION,coverage:'visible_page_only',warnings:['Only visible public awards are observed; full history and pagination are not guaranteed.','League XP is not Arcade points. Unknown awards are excluded from scoring.']};
}
export async function fetchProfile(input:string, fetcher:typeof fetch=fetch):Promise<ProfileSnapshot>{
 let url=normalizeProfile(input); const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
 try{
 for(let hops=0;hops<4;hops++){
  const res=await fetcher(url,{redirect:'manual',signal:controller.signal,headers:{Accept:'text/html','Accept-Language':'en-US', 'User-Agent':'ArcadeTrackerPoC/0.1 (public profile reader)'}});
  if([301,302,303,307,308].includes(res.status)){const location=res.headers.get('location');await res.body?.cancel();if(!location)throw new SourceError('redirect','Missing redirect location');url=normalizeProfile(new URL(location,url).href);continue;}
  if(!res.ok){await res.body?.cancel();throw new SourceError(res.status===429?'rate_limited':res.status===404?'unavailable':'upstream_error',`Google returned HTTP ${res.status}.`);}
  if(!res.headers.get('content-type')?.includes('text/html')){await res.body?.cancel();throw new SourceError('content_type','Expected public HTML.');}
  const reader=res.body?.getReader();if(!reader)throw new SourceError('empty','Empty upstream response');
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2_000_000){await reader.cancel();throw new SourceError('too_large','Profile exceeds 2 MB limit.');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  return parseProfile(new TextDecoder().decode(bytes),url);
 }
 throw new SourceError('redirect','Too many redirects.');
 }finally{clearTimeout(timeout);}
}

