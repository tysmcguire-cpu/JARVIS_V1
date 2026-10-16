// Displays candidate IDs only. Never chooses an owner, pairs a chat or acknowledges updates.
process.loadEnvFile('.env');
async function main(){
 const marker=process.argv[2];if(!marker){const {randomBytes}=await import('node:crypto');const challenge=randomBytes(12).toString('base64url');console.info(`Send /start ${challenge} to your own bot in Telegram, then run: pnpm telegram:identify ${challenge}`);return;}
 if(!/^[A-Za-z0-9_-]{16,64}$/.test(marker))throw Error('Invalid marker');
 const {z}=await import('zod');const token=z.string().regex(/^\d{5,20}:[A-Za-z0-9_-]{30,}$/).parse(process.env.TELEGRAM_BOT_TOKEN);
 const {telegramRequest}=await import('../src/features/telegram/transport');const config={token};
 const info=await telegramRequest(config,'getWebhookInfo') as {url?:string};if(info.url)throw Error('Webhook active');
 const updates=await telegramRequest(config,'getUpdates',{timeout:10,limit:100,allowed_updates:['message']}) as {message?:{text?:string;forward_origin?:unknown;via_bot?:unknown;from?:{id:number;is_bot:boolean};chat?:{id:number;type:string}}}[];
 const seen=new Set<string>();for(const update of updates){const m=update.message;if(m?.text==='/start '+marker&&!m.forward_origin&&!m.via_bot&&m.chat?.type==='private'&&m.from&&!m.from.is_bot&&Number.isSafeInteger(m.from.id)&&Number.isSafeInteger(m.chat.id)){const line=`Matching chat: TELEGRAM_OWNER_USER_ID=${m.from.id} TELEGRAM_OWNER_CHAT_ID=${m.chat.id}`;if(!seen.has(line)){seen.add(line);console.info(line)}}}
 if(!seen.size)console.info('No matching private message found. Send the exact /start marker to your own bot, then run the same identify command again.');
 console.info('Enter the matching IDs locally in .env. Nothing was paired, acknowledged or saved. Stop other polling processes while identifying.');
}
main().catch(()=>{console.error('Could not identify the chat. Check the local bot token and stop any polling process; an active webhook must be managed separately. Private details suppressed.');process.exitCode=1});
export {};
