// Local-only command loop. Explicitly invoked by the owner; never starts with Next.js.
process.loadEnvFile('.env');
async function main(){
 const {getTelegramConfig}=await import('../src/features/telegram/config');const config=getTelegramConfig();if(!config)throw Error('Configure TELEGRAM_ENABLED, bot token and approved IDs in .env first.');
 const {telegramRequest}=await import('../src/features/telegram/transport');const {processUpdate,flushReplies}=await import('../src/features/telegram/service');
 const repliesOnly=process.argv.includes('--replies-only');
 if(!repliesOnly){const info=await telegramRequest(config,'getWebhookInfo') as {url?:string};if(info.url)throw Error('A webhook is registered. Use its reply worker or explicitly remove it in Telegram before polling.');await telegramRequest(config,'getMe');}
 let stopping=false;const stop=()=>{stopping=true};process.on('SIGINT',stop);process.on('SIGTERM',stop);console.info(repliesOnly?'Telegram reply worker running. Ctrl+C stops it.':'Telegram local polling running. Only the approved private chat is accepted. Ctrl+C stops it.');let offset:number|undefined;
 while(!stopping){try{await flushReplies(config);if(repliesOnly){await new Promise(r=>setTimeout(r,5000));continue;}const updates=await telegramRequest(config,'getUpdates',{offset,timeout:25,limit:20,allowed_updates:['message']}) as {update_id:number}[];if(!Array.isArray(updates))throw Error('Invalid update response');for(const update of updates){if(stopping)break;if(!Number.isSafeInteger(update.update_id))throw Error('Invalid update');await processUpdate(update,config);offset=update.update_id+1;await flushReplies(config);}}catch{console.error('Telegram temporarily unavailable; retrying in 5 seconds. Private details suppressed.');await new Promise(r=>setTimeout(r,5000));}}
 const {db}=await import('../src/lib/db');await db.$disconnect();console.info('Telegram stopped.');
}
main().catch(error=>{console.error(error instanceof Error&&error.message.startsWith('Configure ')?error.message:'Telegram could not start. Check credentials, database setup and webhook/polling mode. Private details suppressed.');process.exitCode=1});

export {};
