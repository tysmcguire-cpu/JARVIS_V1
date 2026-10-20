import type {RecordRow} from './config';
export type AccountHistory={accountId:string;opening:string;points:{date:string;balance:string}[]};
export function accountSnapshot(account:RecordRow,transactions:RecordRow[],categories:RecordRow[],month:string,today:string):AccountHistory{
 const start=month+'-01',selected=transactions.filter(t=>t.accountId===account.id);
 const net=(rows:RecordRow[])=>rows.reduce((sum,t)=>sum+(categories.find(c=>c.id===t.categoryId)?.kind==='income'?1n:-1n)*BigInt(t.amount),0n);
 const opening=BigInt(account.openingBalance)+net(selected.filter(t=>t.date<start));
 const result:AccountHistory={accountId:account.id,opening:opening.toString(),points:[]};if(start>today)return result;
 const first=new Date(start+'T12:00:00Z'),last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0,12)).toISOString().slice(0,10),end=last<today?last:today;
 result.points.push({date:new Date(first.getTime()-86400000).toISOString().slice(0,10),balance:opening.toString()});let balance=opening;
 for(let day=first;day.toISOString().slice(0,10)<=end;day=new Date(day.getTime()+86400000)){const date=day.toISOString().slice(0,10);balance+=net(selected.filter(t=>t.date===date));result.points.push({date,balance:balance.toString()})}
 return result;
}
export function accountHistorySql(owner:string,month:string){
 const today=`(CURRENT_TIMESTAMP AT TIME ZONE COALESCE((SELECT timezone FROM "UserSettings" WHERE "userId"=${owner}),'America/Chicago'))::date`;
 return `(SELECT COALESCE(jsonb_agg(jsonb_build_object('accountId',a.id,'opening',base.opening::text,'points',(SELECT COALESCE(jsonb_agg(jsonb_build_object('date',p.date::text,'balance',p.balance::text) ORDER BY p.date),'[]'::jsonb) FROM(
 SELECT (${month}::date-1) AS date,base.opening AS balance WHERE ${month}::date<=${today}
 UNION ALL SELECT day.date::date,base.opening+sum(COALESCE(changes.net,0)) OVER(ORDER BY day.date) AS balance
 FROM generate_series(${month}::date,LEAST((${month}::date+interval '1 month'-interval '1 day')::date,${today}),interval '1 day') day(date)
 LEFT JOIN(SELECT t.date,sum(CASE WHEN c.kind='income' THEN t.amount ELSE -t.amount END) AS net FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" WHERE t."userId"=${owner} AND t."accountId"=a.id AND t.date>=${month}::date AND t.date<${month}::date+interval '1 month' GROUP BY t.date) changes ON changes.date=day.date::date
 ) p)) ORDER BY a.title,a.id),'[]'::jsonb) FROM page_rows a CROSS JOIN LATERAL(SELECT a."openingBalance"+COALESCE(sum(CASE WHEN c.kind='income' THEN t.amount ELSE -t.amount END),0) AS opening FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" WHERE t."userId"=${owner} AND t."accountId"=a.id AND t.date<${month}::date) base)`;
}
