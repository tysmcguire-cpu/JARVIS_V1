import {EventEmitter} from 'node:events';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {supervise} from '../../scripts/supervise';
class Child extends EventEmitter {kill=vi.fn((signal:string)=>signal==='SIGTERM'||signal==='SIGKILL')}
afterEach(()=>vi.useRealTimers());
describe('hosted service supervision',()=>{
  it('stops the sibling and fails when a background child exits unexpectedly',()=>{
    const web=new Child(),worker=new Child(),exit=vi.fn();
    supervise([web,worker],exit);worker.emit('exit',0,null);
    expect(web.kill).toHaveBeenCalledWith('SIGTERM');expect(exit).not.toHaveBeenCalled();
    web.emit('exit',0,'SIGTERM');expect(exit).toHaveBeenCalledExactlyOnceWith(1);
  });
  it('drains both processes on shutdown and exits successfully',()=>{
    const web=new Child(),worker=new Child(),exit=vi.fn(),stop=supervise([web,worker],exit);
    stop();stop();expect(web.kill).toHaveBeenCalledTimes(1);expect(worker.kill).toHaveBeenCalledWith('SIGTERM');
    web.emit('exit',0,null);worker.emit('exit',0,null);expect(exit).toHaveBeenCalledExactlyOnceWith(0);
  });
  it('forces termination after the shutdown deadline',()=>{
    vi.useFakeTimers();const child=new Child(),exit=vi.fn(),stop=supervise([child],exit,100);
    stop();vi.advanceTimersByTime(100);expect(child.kill).toHaveBeenLastCalledWith('SIGKILL');expect(exit).toHaveBeenCalledExactlyOnceWith(1);
    child.emit('exit',null,'SIGKILL');expect(exit).toHaveBeenCalledTimes(1);
  });
  it('handles startup failure without leaving the web server alive',()=>{
    const web=new Child(),worker=new Child(),exit=vi.fn();supervise([web,worker],exit);
    worker.emit('error',new Error('synthetic spawn failure'));expect(web.kill).toHaveBeenCalledWith('SIGTERM');
    web.emit('exit',0,null);expect(exit).toHaveBeenCalledExactlyOnceWith(1);
  });
});
