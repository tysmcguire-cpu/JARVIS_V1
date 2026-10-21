export const helpText=`PLUTO commands:
+400 — add income
-20 food — add an expense
-20 food lunch — category + description
-20 food | Checking — choose an account
/start PAIRING_CODE — pair from Settings
/help · /status · /undo
/task Title | YYYY-MM-DD | normal/high/low
/remind Exact task title | YYYY-MM-DD | HH:MM
/note Title | Content | Tag
/idea Title | Details
/expense 12.34 | Exact account | Exact category | Description | YYYY-MM-DD
/income 12.34 | Exact account | Exact category | Description | YYYY-MM-DD
/tasks search · /notes search · /projects search
/balance
/ask domain | YYYY-MM-DD | YYYY-MM-DD | optional title search — local grounded analysis
Dates are explicit; times use your workspace timezone. /undo removes your last unchanged Telegram-created record (within 24 hours). Reminder delivery follows Notification Center settings and a running worker. /ask uses bounded local tools, not OpenAI. Domains: finances, education, calendar, career, projects, goals, notes, sources, weekly. Telegram bot chats are not end-to-end encrypted.`;
export type ParsedCommand={name:string;args:string;parts:string[]};
export function parseCommand(text:string):ParsedCommand {if(/^[+-]/.test(text.trim()))return {name:'money',args:text.trim(),parts:[text.trim()]};const match=/^\/([a-z]+)(?:@[A-Za-z0-9_]+)?(?:\s+([\s\S]*))?$/i.exec(text.trim());if(!match)return {name:'unknown',args:'',parts:[]};const args=(match[2]??'').trim();return {name:match[1].toLowerCase(),args,parts:args.split('|').map(s=>s.trim())}}
export class CommandError extends Error{}
export function requireParts(parts:string[],minimum:number,maximum=minimum){if(parts.length<minimum||parts.length>maximum||parts.some(p=>!p))throw new CommandError('Please use the fields shown in /help, separated by |. Dates must be YYYY-MM-DD.');}
