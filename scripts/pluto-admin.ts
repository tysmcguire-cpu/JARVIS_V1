import {PrismaClient} from '@prisma/client';
import {randomBytes,createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {z} from 'zod';
import {loadEnvironment} from './load-environment';
loadEnvironment();
async function main(){
 if(process.env.PLUTO_ALLOW_ADMIN_PROVISIONING!=='approved'||!process.env.DIRECT_URL)throw Error('Explicit commercial administrator provisioning approval is required.');
 const id=z.uuid().parse(process.env.PLUTO_ADMIN_AUTH_ID),mode=process.argv[2];if(!['grant','revoke','issue-key','revoke-key'].includes(mode))throw Error('Choose grant, revoke, issue-key or revoke-key.');const db=new PrismaClient({datasourceUrl:process.env.DIRECT_URL});
 try{await db.$transaction(async tx=>{
  if(mode==='revoke-key'){const keyId=z.uuid().parse(process.env.PLUTO_ADMIN_API_KEY_ID);await tx.$executeRawUnsafe('UPDATE "AdminApiKey" SET "revokedAt"=now() WHERE id=$1::uuid AND "adminId"=$2::uuid',keyId,id);return}
  if(mode==='revoke'){await tx.$executeRawUnsafe('UPDATE "AdminMembership" SET active=false WHERE "authId"=$1::uuid',id);await tx.$executeRawUnsafe('INSERT INTO "AdminAccess"("adminId",channel,outcome)VALUES($1::uuid,\'provisioning\',\'revoked\')',id);return}
  const [user]=await tx.$queryRawUnsafe<{ok:boolean}[]>('SELECT EXISTS(SELECT 1 FROM auth.users WHERE id=$1::uuid AND email_confirmed_at IS NOT NULL) AND EXISTS(SELECT 1 FROM auth.mfa_factors WHERE user_id=$1::uuid AND status=\'verified\') AND NOT EXISTS(SELECT 1 FROM "User" WHERE id=$1::uuid) AS ok',id);if(!user.ok)throw Error('Use a separate verified administrator identity with enrolled MFA, never a customer identity.');
  if(mode==='grant'){await tx.$executeRawUnsafe('INSERT INTO "AdminMembership"("authId",role)VALUES($1::uuid,\'owner_admin\')ON CONFLICT("authId")DO UPDATE SET active=true',id);await tx.$executeRawUnsafe('INSERT INTO "AdminAccess"("adminId",channel,outcome)VALUES($1::uuid,\'provisioning\',\'granted\')',id);return}
  const [member]=await tx.$queryRawUnsafe<{active:boolean}[]>('SELECT active FROM "AdminMembership" WHERE "authId"=$1::uuid',id);if(!member?.active)throw Error('Explicit active administrator membership required.');
  const path=resolve(z.string().min(1).parse(process.env.PLUTO_ADMIN_KEY_OUTPUT)),local=relative(process.cwd(),path);if(!local.startsWith('..')&&!isAbsolute(local))throw Error('Store the API credential outside the repository.');
  const token='pluto_admin_'+randomBytes(32).toString('base64url'),hash=createHash('sha256').update(token).digest('hex');await writeFile(path,token+'\n',{flag:'wx',mode:0o600});await tx.$executeRawUnsafe('INSERT INTO "AdminApiKey"("adminId",hash,"expiresAt")VALUES($1::uuid,$2,now()+interval \'30 days\')',id,hash);await tx.$executeRawUnsafe('INSERT INTO "AdminAccess"("adminId",channel,outcome)VALUES($1::uuid,\'provisioning\',\'api_key_issued\')',id);
 });console.info('Requested administrator operation completed. No credentials are printed.');}finally{await db.$disconnect()}
}
main().catch(()=>{console.error('Administrator operation failed. Verify separate environment, approval, identity, MFA and output-file settings. Private details suppressed.');process.exitCode=1});
