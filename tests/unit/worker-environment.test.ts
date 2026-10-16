import {describe,expect,it,vi} from 'vitest';
import {loadEnvironment} from '../../scripts/load-environment';

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
});
