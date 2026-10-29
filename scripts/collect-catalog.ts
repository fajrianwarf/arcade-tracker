import {readFile} from 'node:fs/promises';
import {parseArcadeCatalog} from '../src/lib/catalog';
const index=process.argv.indexOf('--fixture');
let html:string;
if(index>=0)html=await readFile(process.argv[index+1],'utf8');
else{const res=await fetch('https://go.cloudskillsboost.google/arcade',{signal:AbortSignal.timeout(20000)});if(!res.ok)throw new Error(`Catalog HTTP ${res.status}`);const body=await res.text();if(body.length>2_000_000)throw new Error('Catalog exceeds size cap');html=body;}
console.log(JSON.stringify(parseArcadeCatalog(html),null,2));
