import * as cheerio from 'cheerio';
export function parseArcadeCatalog(html:string){
 const outer=cheerio.load(html);const items=new Map<string,{title:string;source_url:string;kind:'game';published:false}>();
 outer('[data-code]').each((_,el)=>{const $=cheerio.load(outer(el).attr('data-code')??'');
 $('.shuffle-item').each((_,card)=>{const title=$(card).find('.card-title').text().trim();const href=$(card).find('a[href*="/games/"]').first().attr('href');if(!title||!href)return;
 const url=new URL(href);if(url.origin!=='https://www.skills.google'||!/^\/games\/\d+$/.test(url.pathname))return;
 const canonical=url.origin+url.pathname;items.set(canonical,{title,source_url:canonical,kind:'game',published:false});});});
 if(!items.size)throw new Error('Catalog markup changed or contains no recognized game cards. Preserve previously reviewed catalog.');
 return {source:'https://go.cloudskillsboost.google/arcade',adapter_version:'arcade-embedded-html/v1',review_required:true,items:[...items.values()]};
}
