import {it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
it('executes the migration launcher in the actual Node/tsx module format and refuses unapproved work before connecting',()=>{
 const result=spawnSync(process.execPath,['--import','tsx','scripts/pluto-migrate.ts'],{encoding:'utf8',env:{...process.env,PLUTO_SUPABASE_PROJECT_REF:'qnfyrnbrrehgdqursitg',NEXT_PUBLIC_SUPABASE_URL:'',DIRECT_URL:'',DATABASE_URL:'',JARVIS_OWNER_ID:'',PLUTO_ALLOW_MIGRATIONS:'false'}});
 expect(result.status).toBe(1);expect(result.stderr).toContain('migration launcher refused');expect(result.stderr).not.toMatch(/Transform failed|Top-level await|ERR_INVALID_ARG/);expect(result.stdout).not.toContain('migrations applied');
},15000);
