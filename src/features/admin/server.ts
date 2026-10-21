import 'server-only';
import {redirect} from 'next/navigation';
import {requireIdentity} from '@/features/auth/server';
import {createAuthClient} from '@/lib/supabase/server';
import {withAdminDatabase} from './database';
import {metricRange,metricsSchema} from './contracts';
export async function requireAdministrator(){const user=await requireIdentity();const member=await withAdminDatabase('dashboard',async tx=>{await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${user.id},true)`;const [row]=await tx.$queryRawUnsafe<{member:boolean}[]>('SELECT public.pluto_admin_member() AS member');return row.member});if(!member)redirect('/login?status=admin-required&next=admin');const {data,error}=await (await createAuthClient()).auth.getClaims();if(error||data?.claims.sub!==user.id||data.claims.aal!=='aal2'||!user.factors?.some(f=>f.status==='verified'))redirect('/mfa?next=admin');return user}
export async function administratorMetrics(input:unknown){const range=metricRange.parse(input),user=await requireAdministrator();return withAdminDatabase('dashboard',async tx=>{await tx.$queryRaw`SELECT set_config('request.jwt.claim.sub',${user.id},true)`;await tx.$queryRawUnsafe("SELECT set_config('pluto.admin.aal','aal2',true)");const [row]=await tx.$queryRawUnsafe<{metrics:unknown}[]>('SELECT public.pluto_admin_metrics($1::date,$2::date,$3) AS metrics',range.from,range.to,process.env.PLUTO_BILLING_MODE==='live');return metricsSchema.parse(row.metrics)})}
