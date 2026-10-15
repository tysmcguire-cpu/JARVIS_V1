import { Dashboard } from "@/features/dashboard/dashboard";
import { Shell } from "@/features/shell/shell";
export default function Home() { return <Shell active="dashboard" demo={false}><Dashboard demo={false} /></Shell>; }
