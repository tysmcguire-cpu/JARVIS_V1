import {describe,expect,it,vi} from 'vitest';
import {loadEnvironment} from '../../scripts/load-environment';
import {spawnSync} from 'node:child_process';

describe('worker environment on local and hosted runtimes',()=>{
  it('loads local configuration when available',()=>{
    const load=vi.fn();loadEnvironment(load);expect(load).toHaveBeenCalledWith('.env');
  });
  it('accepts host-injected configuration with no local file',()=>{
    expect(()=>loadEnvironment(()=>{throw Object.assign(new Error('missing'),{code:'ENOENT'})})).not.toThrow();
  });
  it('fails closed and redacts other file errors',()=>{
    expect(()=>loadEnvironment(()=>{throw Object.assign(new Error('private file detail'),{code:'EACCES'})})).toThrow('Unable to load local environment configuration. Private details suppressed.');
  });
  it('loads every hosted worker dependency in the actual production Node server runtime without Next web context',()=>{
    const script="Promise.all([import('./src/features/integrations/canvas-feed-worker.ts'),import('./src/features/notifications/worker.ts'),import('./src/features/telegram/service.ts'),import('./src/features/banking/worker.ts')]).then(()=>console.log('WORKER_IMPORTS_READY')).catch(()=>{console.error('WORKER_IMPORT_FAILED');process.exitCode=1})";
    const result=spawnSync(process.execPath,['--conditions=react-server','--import','tsx','--eval',script],{cwd:process.cwd(),env:{...process.env,NODE_ENV:'production',DATABASE_URL:'postgresql://synthetic:synthetic@127.0.0.1:1/synthetic?connect_timeout=1'},encoding:'utf8',timeout:15000});
    expect(result.error).toBeUndefined();expect(result.status).toBe(0);expect(result.stdout).toContain('WORKER_IMPORTS_READY');
  },20000);
});
