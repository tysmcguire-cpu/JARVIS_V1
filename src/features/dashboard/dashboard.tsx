import {DashboardController} from './dashboard-controller';
import {readPersonalState} from '@/features/productivity/state-actions';
import {dashboardSchema} from '@/features/productivity/contracts';
export async function Dashboard({demo}:{demo:boolean}) {
 if(demo)return <DashboardController demo/>;
 const saved=await readPersonalState('dashboard');const parsed=dashboardSchema.safeParse(saved.value);
 return <DashboardController demo={false} initial={parsed.success?parsed.data:undefined} version={saved.version}/>;
}
