import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {loadEnvironment} from './load-environment';
loadEnvironment();
if(process.env.PLUTO_ALLOW_MIGRATIONS!=='approved'||!process.env.DIRECT_URL||!process.env.PLUTO_SUPABASE_PROJECT_REF)throw Error('Commercial migrations require an explicitly approved, separate Pluto project.');
const require=createRequire(import.meta.url),result=spawnSync(process.execPath,[require.resolve('prisma/build/index.js'),'migrate','deploy'],{stdio:'inherit'});
process.exitCode=result.status??1;
