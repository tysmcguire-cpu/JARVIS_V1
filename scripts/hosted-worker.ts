import {setTimeout as pause} from 'node:timers/promises';
import {loadEnvironment} from './load-environment';
loadEnvironment();
async function main(){
 const {commercialWorkerTick}=await import('../src/features/commercial/worker');
 const {closeWorkerDatabase}=await import('../src/lib/worker-db');
 if(process.env.PLUTO_WORKERS_ENABLED!=='true')throw Error('Commercial workers disabled');
 const controller=new AbortController();process.once('SIGTERM',()=>controller.abort());process.once('SIGINT',()=>controller.abort());
 console.info('Pluto commercial workers starting. Per-customer leases and opt-ins apply.');
 try{do{const watchdog=setTimeout(()=>{console.error('Worker stalled; restart required.');process.exit(1)},240000);try{await commercialWorkerTick()}catch{console.error('Commercial worker temporarily unavailable. Details suppressed.')}finally{clearTimeout(watchdog)}if(process.argv.includes('--once'))break;try{await pause(30000,undefined,{signal:controller.signal})}catch{break}}while(!controller.signal.aborted)}finally{await closeWorkerDatabase();await (await import('../src/features/commercial/erasure')).closeErasureDatabase()}
}
main().catch(()=>{console.error('Commercial worker could not start. Check separate runtime credentials and flags.');process.exitCode=1});