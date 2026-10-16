import {PrismaClient} from '@prisma/client';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {z} from 'zod';
import {exportSnapshot,parseSnapshot,restoreSnapshot} from '../src/features/data-controls/snapshot';
import {sealBackup,openBackup} from '../src/features/data-controls/backup';
process.loadEnvFile('.env');
async function main(){const [operation,path,...flags]=process.argv.slice(2);if(!['create','verify','restore'].includes(operation)||!path)throw Error('Usage: pnpm backup create|verify|restore <file> [--replace --owner=<UUID>]');const owner=z.uuid().parse(process.env.JARVIS_OWNER_ID),key=process.env.JARVIS_BACKUP_KEY??'';if(!/^[a-fA-F0-9]{64}$/.test(key))throw Error('Save an owner-controlled 64-hex-character JARVIS_BACKUP_KEY locally first.');const file=resolve(path);
 if(operation==='verify'){parseSnapshot(openBackup(await readFile(file,'utf8'),key),owner);console.info('Backup authentication, format and ownership verified. No database changes made.');return}
 if(operation==='restore'&&(!flags.includes('--replace')||!flags.includes('--owner='+owner)))throw Error('Restore replaces ALL JARVIS data. Stop all workers, then explicitly pass --replace --owner=<your configured UUID>.');
 if(operation==='restore'&&(process.env.JARVIS_NOTIFICATIONS_ENABLED==='true'||process.env.TELEGRAM_ENABLED==='true'))throw Error('Disable Telegram/notification workers in local configuration and stop their processes before restore.');
 const database=new PrismaClient({datasources:{db:{url:process.env.DIRECT_URL}}});try{await database.$transaction(async tx=>{await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${owner},true)`;if(operation==='create'){const data=await exportSnapshot(tx,owner);await writeFile(file,sealBackup(data,key),{flag:'wx',mode:0o600});console.info('Encrypted backup created at the explicitly selected path. No existing file overwritten.');}else{const snapshot=parseSnapshot(openBackup(await readFile(file,'utf8'),key),owner);await restoreSnapshot(tx,owner,snapshot);console.info('JARVIS data restored. Providers disconnected, pairing cleared, old notifications canceled. Environment credentials were not changed.');}},{timeout:60000})}finally{await database.$disconnect()}}
main().catch(()=>{console.error('Backup command failed. Check arguments, local key, permissions and documented restore safeguards. Private details suppressed.');process.exitCode=1});
