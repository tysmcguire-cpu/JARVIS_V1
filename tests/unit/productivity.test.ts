import {beforeAll,afterAll,it,expect,vi} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {entities} from '@/features/tracking/config';
import {dashboardSchema,defaultDashboard} from '@/features/productivity/contracts';
import {eventSeriesDates,eventConflicts} from '@/features/tracking/event-series';
let database:PGlite;const owner=randomUUID(),other=randomUUID();let actor=owner;
vi.mock('server-only',()=>({}));
vi.mock('@/lib/owner-db',()=>({withOwnerDatabase:async(work:(tx:unknown,id:string)=>Promise<unknown>)=>database.transaction(async tx=>{
 await tx.exec(`SET LOCAL ROLE runtime;SET LOCAL request.jwt.claim.sub='${actor}'`);
 return work({$queryRawUnsafe:async(sql:string,...args:unknown[])=>(await tx.query(sql,args)).rows,$executeRawUnsafe:async(sql:string,...args:unknown[])=>(await tx.query(sql,args)).affectedRows,auditLog:{create:({data}:{data:{userId:string;action:string;outcome:string}})=>tx.query('INSERT INTO "AuditLog"(id,"userId",action,outcome) VALUES($1,$2,$3,$4)',[randomUUID(),data.userId,data.action,data.outcome])}},actor);
})}));
import {undoTransactionDeletion} from '@/features/tracking/transaction-undo';
import {readPersonalState,savePersonalState} from '@/features/productivity/state-actions';
import {writeRecord,readWorkspace,writeInlineNote,removeRecord} from '@/features/tracking/repository';
import {financeAccounts,transferMoney,reconcileAccount,recordRecurringPayment} from '@/features/tracking/finance-operations';
import {searchEverything,readHub,quickCapture} from '@/features/productivity/hub-actions';
beforeAll(async()=>{database=new PGlite();await database.exec(`CREATE SCHEMA auth;CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE jarvis_app;CREATE ROLE runtime INHERIT;GRANT jarvis_app TO runtime;GRANT USAGE ON SCHEMA public,auth TO runtime;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;INSERT INTO auth.users VALUES('${owner}'),('${other}');`);
 for(const name of readdirSync('prisma/migrations').filter(n=>/^\d/.test(n)).sort())await database.exec(readFileSync('prisma/migrations/'+name+'/migration.sql','utf8'));
 await database.exec(`INSERT INTO "User"(id,"updatedAt") VALUES('${owner}',now());INSERT INTO "UserSettings"("userId","updatedAt") VALUES('${owner}',now());GRANT SELECT,INSERT,UPDATE,DELETE ON ${entities.map(e=>'"'+e.key+'"').join(',')},"WorkspaceState","ApiConnection","ExternalRecord","NotificationJob" TO runtime;GRANT SELECT ON "UserSettings" TO runtime;GRANT INSERT ON "AuditLog" TO runtime;CREATE POLICY fixture_settings ON "UserSettings" FOR SELECT TO runtime USING((SELECT auth.uid())="userId");`);
},30000);
afterAll(async()=>database?.close());
it('persists layouts with optimistic concurrency, bounded grid capacity and independent RLS',async()=>{
 const saved=await savePersonalState('dashboard',{...defaultDashboard,layout:'custom'},0);expect(saved.version).toBe(1);await expect(savePersonalState('dashboard',defaultDashboard,0)).rejects.toThrow('changed');
 expect(dashboardSchema.safeParse({...defaultDashboard,widgets:defaultDashboard.widgets.map(w=>({...w,wide:true}))}).success).toBe(false);
 actor=other;try{expect((await readPersonalState('dashboard')).value).toBeNull();await expect(savePersonalState('dashboard',defaultDashboard,0)).rejects.toThrow()}finally{actor=owner}
 expect((await readPersonalState('dashboard')).version).toBe(1);
 await database.exec(`SET ROLE anon`);try{await expect(database.query('SELECT * FROM "WorkspaceState"')).rejects.toThrow('permission')}finally{await database.exec('RESET ROLE')}
});
it('keeps owner-bound drafts and ten real note revisions, rejecting stale note saves',async()=>{
 await writeRecord('Note',{title:'Recovery note',tag:'school',content:'Version zero'});let note=(await readWorkspace('Note',{search:'Recovery note'})).rows[0];
 await savePersonalState('note-draft:'+note.id,{title:note.title,tag:note.tag,content:'Draft body',baseVersion:note.updatedAt},0);
 expect((await readPersonalState('note-draft:'+note.id)).value).toMatchObject({content:'Draft body'});
 for(let i=1;i<=12;i++)note=await writeInlineNote({title:note.title,tag:note.tag,content:'Version '+i},note.id,note.updatedAt);
 const history=await readPersonalState('note-history:'+note.id);expect(history.value).toHaveLength(10);expect((history.value as {content:string}[])[0].content).toBe('Version 11');
 await expect(writeInlineNote({title:'Stale',tag:'',content:''},note.id,'2000-01-01T00:00:00Z')).rejects.toThrow('changed');expect((await readPersonalState('note-history:'+note.id)).value).toEqual(history.value);
 await expect(savePersonalState('note-history:'+note.id,[],history.version)).rejects.toThrow('only');await expect(savePersonalState('note-draft:'+randomUUID(),{title:'No owner',tag:'',content:'',baseVersion:''},0)).rejects.toThrow('unavailable');
 expect((await readWorkspace('Note',{search:'Version 12'})).rows[0].id).toBe(note.id);
});
it('saves scenarios by course and links only existing authorized records',async()=>{
 await writeRecord('Course',{title:'Math 101',code:'M101',term:'Fall',instructor:'Test'});const course=(await readWorkspace('Course',{})).rows[0];
 const scenario={rows:[{label:'Exam',earned:'80',possible:'100',weight:'50'}],mode:'weighted',target:'90',finalWeight:'20'};
 await savePersonalState('calculator:'+course.id,scenario,0);expect((await readPersonalState('calculator:'+course.id)).value).toEqual(scenario);
 const note=(await readWorkspace('Note',{})).rows[0];await savePersonalState('links:Note:'+note.id,[{key:'Course',id:course.id,title:course.title}],0);
 await expect(savePersonalState('links:Note:'+note.id,[{key:'Course',id:randomUUID(),title:'Unavailable'}],1)).rejects.toThrow('unavailable');
});
it('searches across modules, escapes literal wildcard input and loads real Today counts',async()=>{
 await quickCapture('Task','Project 100% ready','2026-01-01');expect((await searchEverything('100%'))).toHaveLength(1);expect((await searchEverything('Recovery'))[0].key).toBe('Note');
 const hub=await readHub();expect(hub.groups.tasks.total).toBe(1);expect(hub.groups.notes.total).toBe(1);expect(hub.timezone).toBe('America/Chicago');expect(hub.unread).toBe(0);
 actor=other;try{expect(await searchEverything('Recovery')).toEqual([])}finally{actor=owner}
});
it('posts exact paired transfers once, excludes them from spending and deletes both sides',async()=>{
 await writeRecord('FinancialAccount',{title:'Checking',currency:'USD',openingBalance:'100.00'});await writeRecord('FinancialAccount',{title:'Savings',currency:'USD',openingBalance:'0.00'});await writeRecord('FinancialAccount',{title:'Euro',currency:'EUR',openingBalance:'0.00'});
 let accounts=await financeAccounts();const from=accounts.find(a=>a.title==='Checking')!.id,to=accounts.find(a=>a.title==='Savings')!.id;
 const input={from,to,amount:'20.01',date:'2026-10-20',title:'Move savings',requestId:randomUUID()};await transferMoney(input);await transferMoney(input);accounts=await financeAccounts();expect(accounts.find(a=>a.id===from)!.balance).toBe('7999');expect(accounts.find(a=>a.id===to)!.balance).toBe('2001');
 const view=await readWorkspace('Transaction',{month:'2026-10',period:true,currency:'USD'});expect(view.total).toBe(2);expect(view.finance).toMatchObject({income:'0',expense:'0',balance:'10000',pie:[]});expect(view.finance!.daily.every(d=>d.minor==='0')).toBe(true);
 await expect(transferMoney({...input,to:accounts.find(a=>a.currency==='EUR')!.id,requestId:randomUUID()})).rejects.toThrow('same currency');
 const row=view.rows[0];await expect(writeRecord('Transaction',{...row,amount:'2.00'},row.id,row.updatedAt)).rejects.toThrow('transfer');const deleted=await removeRecord('Transaction',row.id,row.updatedAt);expect((await readWorkspace('Transaction',{search:'Move savings'})).total).toBe(0);await undoTransactionDeletion(deleted!.undoId!);expect((await readWorkspace('Transaction',{search:'Move savings'})).total).toBe(2);await expect(undoTransactionDeletion(deleted!.undoId!)).rejects.toThrow('already');const restored=(await readWorkspace('Transaction',{search:'Move savings'})).rows[0];await removeRecord('Transaction',restored.id,restored.updatedAt);
});
it('reconciles with an auditable adjustment and rejects a stale displayed balance',async()=>{
 const account=(await financeAccounts()).find(a=>a.title==='Checking')!;const input={account:account.id,balance:'101.23',expected:account.balance,date:'2026-10-20',title:'Counted balance'};await reconcileAccount(input);
 expect((await financeAccounts()).find(a=>a.id===account.id)!.balance).toBe('10123');await expect(reconcileAccount(input)).rejects.toThrow('changed');
});
it('records a due recurring payment atomically and rejects a replay of its old version',async()=>{
 const account=(await financeAccounts()).find(a=>a.title==='Checking')!,category=(await readWorkspace('Category',{search:'Reconciliation'})).rows.find(r=>r.kind==='expense');
 if(!category)await writeRecord('Category',{title:'Bills',kind:'expense'});const expense=category??(await readWorkspace('Category',{search:'Bills'})).rows[0];
 await writeRecord('RecurringExpense',{title:'Monthly bill',accountId:account.id,categoryId:expense.id,amount:'5.00',dueDate:'2026-01-31',frequency:'monthly'});const row=(await readWorkspace('RecurringExpense',{})).rows[0];await recordRecurringPayment(row.id,row.updatedAt);await expect(recordRecurringPayment(row.id,row.updatedAt)).rejects.toThrow('changed');expect((await readWorkspace('RecurringExpense',{})).rows[0].dueDate).toBe('2026-02-28');expect((await readWorkspace('Transaction',{search:'Monthly bill'})).total).toBe(1);
});
it('creates bounded month-end event series once and includes tasks and reminders in calendar data',async()=>{
 const input={title:'Planning meeting',startDate:'2026-01-31',endDate:'2026-01-31',startTime:'10:00',endTime:'11:00',location:'Desk',repeat:'monthly',repeatCount:'3',seriesId:randomUUID()};await writeRecord('Event',input);await writeRecord('Event',input);
 const events=await readWorkspace('Event',{search:'Planning meeting',pageSize:12});expect(events.total).toBe(3);expect(events.rows.map(r=>r.startDate).sort()).toEqual(['2026-01-31','2026-02-28','2026-03-31']);
 const calendar=await readWorkspace('Event',{month:'2026-01'});expect(calendar.calendar.some(r=>r.key==='Task')).toBe(true);expect(calendar.calendar.some(r=>r.key==='Event')).toBe(true);
 expect(eventSeriesDates('2024-01-31','2024-02-01','monthly',2)[1]).toEqual({startDate:'2024-02-29',endDate:'2024-03-01'});expect(()=>eventSeriesDates('2026-01-01','2026-01-01','daily',53)).toThrow();
 expect([...eventConflicts([{id:'a',key:'Event',date:'2026-01-01',time:'10:00',endTime:'11:00'},{id:'b',key:'Event',date:'2026-01-01',time:'10:30',endTime:'11:30'},{id:'c',key:'Event',date:'2026-01-01',time:'11:30',endTime:'12:00'}])]).toEqual(['a','b']);
});
it('returns ordered schedule times and exact zero-filled daily spending without counting transfers',async()=>{
 const before=await readHub(),today=before.today,accounts=await financeAccounts(),checking=accounts.find(a=>a.title==='Checking')!,savings=accounts.find(a=>a.title==='Savings')!,euro=accounts.find(a=>a.currency==='EUR')!;
 await writeRecord('Category',{title:'Chart groceries',kind:'expense'});const category=(await readWorkspace('Category',{search:'Chart groceries'})).rows[0];
 const original=before.dailySpending!.find(s=>s.currency==='USD')!.days.at(-1)!.amount;
 await writeRecord('Transaction',{title:'Chart expense',accountId:checking.id,categoryId:category.id,amount:'15.10',date:today});
 await writeRecord('Transaction',{title:'Euro chart expense',accountId:euro.id,categoryId:category.id,amount:'1.99',date:today});
 await transferMoney({from:checking.id,to:savings.id,amount:'123.45',date:today,title:'Chart transfer',requestId:randomUUID()});
 for(const time of ['14:00','09:00'])await writeRecord('Event',{title:'Schedule '+time,startDate:today,endDate:today,startTime:time,endTime:time==='14:00'?'15:00':'10:00',location:'Desk'});
 const hub=await readHub(),usd=hub.dailySpending!.find(s=>s.currency==='USD')!,eur=hub.dailySpending!.find(s=>s.currency==='EUR')!;
 expect(usd.days).toHaveLength(7);expect(usd.days.at(-1)).toEqual({date:today,amount:(BigInt(original)+1510n).toString()});expect(eur.days.at(-1)!.amount).toBe('199');expect(usd.days.every(d=>/^\d+$/.test(d.amount))).toBe(true);
 expect(hub.groups.schedule.rows.filter(r=>r.title.startsWith('Schedule')).map(r=>r.time)).toEqual(['09:00','14:00']);
});
