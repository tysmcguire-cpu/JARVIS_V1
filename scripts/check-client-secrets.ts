import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
process.loadEnvFile('.env');
async function files(path:string):Promise<string[]>{const entries=await readdir(path,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?files(join(path,e.name)):Promise.resolve([join(path,e.name)])))).flat()}
async function main(){const keys=['DATABASE_URL','DIRECT_URL','TELEGRAM_BOT_TOKEN','OPENAI_API_KEY','JARVIS_CONNECTOR_ENCRYPTION_KEY','JARVIS_BACKUP_KEY','PLAID_SECRET','PLAID_CLIENT_ID'],values=keys.map(k=>process.env[k]).filter((v):v is string=>!!v&&v.length>12),assets=(await files('.next/static')).filter(f=>/\.(js|css|json)$/.test(f));for(const asset of assets){const content=await readFile(asset,'utf8');if(values.some(value=>content.includes(value)))throw Error('Private configuration found in a client asset.');}console.info(`PASS: ${assets.length} client assets checked against configured private values; none found. No secret values printed.`)}
main().catch(()=>{console.error('Client-secret verification failed. Private details suppressed.');process.exitCode=1});
