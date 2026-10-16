import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {loadEnvironment} from './load-environment';
import {supervise} from './supervise';

loadEnvironment();
const require = createRequire(import.meta.url);
const children = [spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '--hostname', '0.0.0.0'], {stdio:'inherit'})];
const background = process.env.JARVIS_NOTIFICATIONS_ENABLED === 'true'
  || (process.env.TELEGRAM_ENABLED === 'true' && !!process.env.TELEGRAM_WEBHOOK_SECRET);
if (background) children.push(spawn(process.execPath, ['--conditions=react-server', '--import', 'tsx', 'scripts/hosted-worker.ts'], {stdio:'inherit'}));
const stop = supervise(children, code => process.exit(code));
process.once('SIGTERM', () => stop());
process.once('SIGINT', () => stop());
console.info(background ? 'Hosted website and background processing starting.' : 'Hosted website starting; background processing disabled.');
