import {administratorMetrics} from '@/features/admin/server';
import {AdminPanel} from '@/features/admin/panel';
export const dynamic='force-dynamic';
export default async function AdminPage(){const to=new Date().toISOString().slice(0,10),from=new Date(Date.parse(to)-29*86400000).toISOString().slice(0,10);return <AdminPanel initial={await administratorMetrics({from,to})}/>}
