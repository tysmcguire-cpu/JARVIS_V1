import { PrismaClient } from '@prisma/client';
import { entities } from '../src/features/tracking/config';
process.loadEnvFile('.env');
const admin=new PrismaClient({datasources:{db:{url:process.env.DIRECT_URL}}});
async function configure(){
 const owner=await admin.user.findUnique({where:{id:process.env.JARVIS_OWNER_ID}});if(!owner||owner.synthetic)throw Error('Owner mismatch');
 const role=await admin.$queryRaw<{present:boolean}[]>`SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='jarvis_app') AS present`;if(!role[0]?.present)throw Error('Provision Foundation first');
 // Static allowlist only. Existing inherited computer logins receive these narrow permissions.
 for(const entity of entities)await admin.$executeRawUnsafe(`GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public."${entity.key}" TO jarvis_app`);
 await admin.$executeRawUnsafe('GRANT INSERT ON TABLE public."AuditLog" TO jarvis_app');
 console.info('Tracking permissions configured. Foundation identity/settings remain read-only. Existing passwords unchanged.');
}
configure().catch(()=>{console.error('Tracking permission setup failed; private details suppressed.');process.exitCode=1}).finally(()=>admin.$disconnect());
