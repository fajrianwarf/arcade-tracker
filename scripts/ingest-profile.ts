import {fetchProfile,parseProfile} from '../src/lib/profile';
import {readFile} from 'node:fs/promises';
const input=process.argv[2];if(!input)throw new Error('Usage: npm run ingest -- HTTPS_PUBLIC_PROFILE_URL [--fixture FILE]');
const fixture=process.argv.indexOf('--fixture');
const snapshot=fixture>-1?parseProfile(await readFile(process.argv[fixture+1],'utf8'),input):await fetchProfile(input);
console.log(JSON.stringify(snapshot,null,2));
