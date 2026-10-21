import {createHash} from 'node:crypto';
import {withAdminDatabase} from '@/features/admin/database';
import {metricRange,metricsSchema} from '@/features/admin/contracts';
export const runtime='nodejs';export const dynamic='force-dynamic';
const reply=(data:unknown,status:number)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
export async function GET(request:Request){const token=request.headers.get('authorization');if(!token||!/^Bearer pluto_admin_[A-Za-z0-9_-]{43}$/.test(token))return reply({error:'unauthorized'},401);const url=new URL(request.url),range=metricRange.safeParse({from:url.searchParams.get('from'),to:url.searchParams.get('to')});if(!range.success)return reply({error:'invalid_range'},400);
 try{const hash=createHash('sha256').update(token.slice(7)).digest('hex');const [row]=await withAdminDatabase('api',tx=>tx.$queryRawUnsafe<{metrics:unknown}[]>('SELECT public.pluto_admin_api_metrics($1,$2::date,$3::date,$4) AS metrics',hash,range.data.from,range.data.to,process.env.PLUTO_BILLING_MODE==='live'));if(row.metrics&&typeof row.metrics==='object'&&'error'in row.metrics)return reply(row.metrics,row.metrics.error==='rate_limited'?429:401);return reply(metricsSchema.parse(row.metrics),200)}catch{return reply({error:'metrics_unavailable'},503)}
}
