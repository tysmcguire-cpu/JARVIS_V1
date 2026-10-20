import {financeGeneralSql} from './finance-general-data';
import {financeOverviewSql} from './finance-data';
import {moduleFactsSql} from './module-metrics-query';
import {canvasProjection} from './canvas-projection';
import {entityFor} from './config';
import {readQuery} from './validation';
// All interpolated identifiers come from the static entity catalog; values are bound.
export function workspaceQuery(key:string,input:unknown){
 const entity=entityFor(key),query=readQuery(input),params:unknown[]=[];
 const bind=(value:unknown)=>{params.push(value);return '$'+params.length};
 const owner=bind(null)+'::uuid'; // Replaced with the verified owner by the repository.
 let where=`"userId"=${owner}`;
 if(query.search)where+=` AND title ILIKE ${bind('%'+query.search.replace(/[\\%_]/g,'\\$&')+'%')}`;
 if(query.status&&entity.fields.some(f=>f.name==='status'))where+=` AND status=${bind(query.status)}`;
 const date=entity.fields.find(f=>f.type==='date'),sort=query.sort==='date'?date?.name??'updatedAt':query.sort;
 const automaticMonth=key==='Transaction'&&query.period&&!(input&&typeof input==='object'&&'month' in input);
 const requestedPage=bind(query.page),monthValue=bind(automaticMonth?null:query.month+'-01'),month=automaticMonth?`COALESCE(${monthValue}::date,date_trunc('month',CURRENT_TIMESTAMP AT TIME ZONE COALESCE((SELECT timezone FROM "UserSettings" WHERE "userId"=${owner}),'America/Chicago'))::date)`:monthValue;
 const financeCurrency=key==='Transaction'?bind(query.currency??'USD'):'';
 if(key==='Transaction'){
 if(query.period)where+=` AND date>=${month}::date AND date<${month}::date+interval '1 month'`;
 where+=` AND EXISTS(SELECT 1 FROM "FinancialAccount" a WHERE a.id="accountId" AND a."userId"=${owner} AND a.currency=${financeCurrency}::text)`;
 }
 const pageSize=key==='Assignment'?6:4;
 const projection=canvasProjection(entity,owner);
 const ctes=[...projection.ctes,`filtered AS NOT MATERIALIZED(SELECT * FROM ${projection.table} WHERE ${where})`,`counts AS(SELECT count(*)::int AS total FROM filtered)`,`paging AS(SELECT total,LEAST(${requestedPage}::int,GREATEST(1,ceil(total/${pageSize}.0)::int)) AS page FROM counts)`,`page_rows AS MATERIALIZED(SELECT * FROM filtered ORDER BY "${sort}" ${query.direction==='asc'?'ASC':'DESC'},id LIMIT ${pageSize} OFFSET (SELECT (page-1)*${pageSize} FROM paging))`];
 const fields=['id',...entity.fields.map(f=>f.name)];
 const rowValues=fields.flatMap(f=>[`'${f}'`,`r."${f}"::text`]);rowValues.push(`'updatedAt'`,`to_char(r."updatedAt" AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
 if(key==='Transaction')rowValues.push("'categoryKind'",`(SELECT kind FROM "Category" c WHERE c.id=r."categoryId" AND c."userId"=${owner})`);
 if(key==='FinancialAccount')rowValues.push("'currentBalance'",`(r."openingBalance"+COALESCE((SELECT sum(CASE WHEN c.kind='income' THEN t.amount ELSE -t.amount END) FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" WHERE t."accountId"=r.id AND t."userId"=${owner}),0))::text`);
 const parent=entity.fields.some(f=>f.name==='accountId')?{table:'FinancialAccount',field:'accountId'}:entity.fields.some(f=>f.name==='budgetId')?{table:'Budget',field:'budgetId'}:null;
 if(parent)rowValues.push(`'currency'`,`(SELECT currency FROM "${parent.table}" p WHERE p.id=r."${parent.field}" AND p."userId"=${owner})`);
 const targets=[...new Set(entity.fields.filter(f=>f.target).map(f=>f.target!))],options:string[]=[],truncated:string[]=[];
 for(const target of targets){
 const related=entity.fields.filter(f=>f.target===target).map(f=>`p.id IN(SELECT "${f.name}" FROM page_rows)`).join(' OR ');
 ctes.push(`base_${target} AS MATERIALIZED(SELECT id,title FROM "${target}" WHERE "userId"=${owner} ORDER BY title,id LIMIT 501)`);
 options.push(`'${target}'`,`(SELECT COALESCE(jsonb_agg(to_jsonb(o) ORDER BY title,id),'[]'::jsonb) FROM(SELECT * FROM(SELECT * FROM base_${target} ORDER BY title,id LIMIT 500) first_choices UNION ALL SELECT p.id,p.title FROM "${target}" p WHERE p."userId"=${owner} AND (${related}) AND p.id NOT IN(SELECT id FROM base_${target} ORDER BY title,id LIMIT 500)) o)`);
 truncated.push(`(SELECT count(*)>500 FROM base_${target})`);
 }

 const calendarTime=key==='Event'? 'CASE WHEN day.date::date=r."startDate" THEN r."startTime" ELSE \'Continues\' END':key==='Reminder'?'r.time':projection.ctes.length?"COALESCE(r.source_metadata->>'dueTime','')":"''::text";
 const calendarDate=key==='Event'?'day.date::date':date?'r."'+date.name+'"':'NULL::date';
 const calendarFrom=key==='Event'?'filtered r CROSS JOIN LATERAL generate_series(GREATEST(r."startDate",'+month+'::date),LEAST(COALESCE(r."endDate",r."startDate"),('+month+'::date+interval \'1 month\'-interval \'1 day\')::date),interval \'1 day\') day(date)':'filtered r';
 const calendarWhere=key==='Event'?'true':date?calendarDate+'>='+month+'::date AND '+calendarDate+'<('+month+'::date+interval \'1 month\')':'false';
 const calendarSql=date?`(SELECT COALESCE(jsonb_agg(to_jsonb(d) ORDER BY date,time,title),'[]'::jsonb) FROM(SELECT r.id,${calendarDate}::text AS date,r.title,${calendarTime} AS time FROM ${calendarFrom} WHERE ${calendarWhere} ORDER BY ${calendarDate},${calendarTime},r.id LIMIT 200) d)`:`'[]'::jsonb`;
 const attributes=[`'rows'`,`(SELECT COALESCE(jsonb_agg(jsonb_build_object(${rowValues.join(',')})${projection.ctes.length?"||COALESCE(r.source_metadata,'{}'::jsonb)":''} ORDER BY r."${sort}" ${query.direction==='asc'?'ASC':'DESC'},r.id),'[]'::jsonb) FROM page_rows r)`,`'total'`,`(SELECT total FROM paging)`,`'page'`,`(SELECT page FROM paging)`,`'pageSize'`,String(pageSize),`'options'`,`jsonb_build_object(${options.join(',')})`,`'relationsTruncated'`,truncated.length?'('+truncated.join(' OR ')+')':'false',`'statuses'`,entity.fields.some(f=>f.name==='status')?`(SELECT COALESCE(jsonb_agg(to_jsonb(s)),'[]'::jsonb) FROM(SELECT status AS label,count(*)::int AS value FROM filtered GROUP BY status ORDER BY status) s)`:`'[]'::jsonb`,`'calendar'`,calendarSql];
 attributes.push("'facts'",moduleFactsSql(entity,owner));
 if(key==='Transaction')attributes.push("'finance'",financeOverviewSql(owner,month,financeCurrency),"'general'",financeGeneralSql(owner,month,financeCurrency));
 if(entity.module==='finances'){
 attributes.push(`'balances'`,`(SELECT COALESCE(jsonb_agg(to_jsonb(b)),'[]'::jsonb) FROM(SELECT a.currency,sum(a."openingBalance"+COALESCE(t.net,0))::text AS balance FROM "FinancialAccount" a LEFT JOIN(SELECT t."accountId",t."userId",sum(CASE WHEN c.kind='income' THEN t.amount ELSE -t.amount END) AS net FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" WHERE t."userId"=${owner} GROUP BY t."accountId",t."userId") t ON t."accountId"=a.id AND t."userId"=a."userId" WHERE a."userId"=${owner} GROUP BY a.currency ORDER BY a.currency) b)`,`'spending'`,`(SELECT COALESCE(jsonb_agg(to_jsonb(s)),'[]'::jsonb) FROM(SELECT a.currency||' · '||c.title AS label,sum(t.amount)::text AS value FROM "Transaction" t JOIN "Category" c ON c.id=t."categoryId" AND c."userId"=t."userId" JOIN "FinancialAccount" a ON a.id=t."accountId" AND a."userId"=t."userId" WHERE t."userId"=${owner} AND c.kind='expense' GROUP BY a.currency,c.title ORDER BY sum(t.amount) DESC LIMIT 6) s)`);
 }
 if(entity.module==='education')attributes.push(`'grade'`,`(SELECT jsonb_build_object('earned',COALESCE(sum("pointsEarned"),0)::text,'possible',COALESCE(sum("pointsPossible"),0)::text) FROM "Grade" WHERE "userId"=${owner})`);
 if(key==='BudgetCategory')attributes.push(`'budgetSpending'`,`(SELECT COALESCE(jsonb_agg(to_jsonb(s)),'[]'::jsonb) FROM(SELECT r.title,b.currency,COALESCE(sum(CASE WHEN a.currency=b.currency THEN t.amount ELSE 0 END),0)::text AS spent FROM page_rows r JOIN "Budget" b ON b.id=r."budgetId" AND b."userId"=${owner} LEFT JOIN "Transaction" t ON t."userId"=${owner} AND t."categoryId"=r."categoryId" AND t.date BETWEEN b."startDate" AND b."endDate" LEFT JOIN "FinancialAccount" a ON a.id=t."accountId" AND a."userId"=${owner} GROUP BY r.id,r.title,b.currency ORDER BY r.title,r.id) s)`);
 // Bind month even for undated entities so PostgreSQL can infer every parameter type.
 return {sql:`WITH ${ctes.join(',')} SELECT jsonb_build_object(${attributes.join(',')}) AS data WHERE ${month}::date IS NOT NULL`,params,entity};
}
