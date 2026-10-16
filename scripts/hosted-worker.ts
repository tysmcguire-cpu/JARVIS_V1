import {setTimeout as pause} from 'node:timers/promises';
import {loadEnvironment} from './load-environment';
loadEnvironment();

async function main() {
  const {notificationTick} = await import('../src/features/notifications/worker');
  const {getTelegramConfig} = await import('../src/features/telegram/config');
  const {flushReplies} = await import('../src/features/telegram/service');
  const {db} = await import('../src/lib/db');
  const notifications = process.env.JARVIS_NOTIFICATIONS_ENABLED === 'true';
  const telegram = getTelegramConfig();
  const replies = !!telegram && !!process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!notifications && !replies) throw Error('No background task enabled');
  const controller = new AbortController();
  process.once('SIGTERM', () => controller.abort());
  process.once('SIGINT', () => controller.abort());
  let failures = 0;
  console.info(`Hosted background processing running: notifications ${notifications ? 'enabled' : 'disabled'}, webhook reply retries ${replies ? 'enabled' : 'disabled'}.`);
  try {
    while (!controller.signal.aborted) {
      // A stalled task fails the supervised service rather than silently missing schedules.
      const watchdog = setTimeout(() => {console.error('Background processing stalled; restarting service.');process.exit(1)}, 120000);
      let failed = false;
      try {if (notifications) await notificationTick()} catch {failed = true}
      try {if (replies && !controller.signal.aborted) await flushReplies(telegram!)} catch {failed = true}
      clearTimeout(watchdog);
      if (failed) {
        failures++;
        if (failures === 1 || failures % 20 === 0) console.error('Background task temporarily unavailable; retrying. Private details suppressed.');
      } else {
        if (failures) console.info('Background processing recovered.');
        failures = 0;
      }
      if (process.argv.includes('--once')) {if (failed) process.exitCode = 1;break}
      try {await pause(30000, undefined, {signal:controller.signal})} catch {break}
    }
  } finally {await db.$disconnect()}
}
main().catch(() => {console.error('Hosted background processing could not start. Private details suppressed.');process.exitCode=1});
