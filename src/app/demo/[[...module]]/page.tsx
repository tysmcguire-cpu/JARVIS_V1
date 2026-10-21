import {cookies} from 'next/headers';
import {paletteSchema} from '@/features/settings/appearance';
import {AppearanceProvider} from '@/features/settings/appearance-provider';
import { notFound } from "next/navigation";
import { demoEnabled } from "@/features/auth/policy";
import { findModule } from "@/features/shell/navigation";
import { Shell } from "@/features/shell/shell";
import { ModulePage } from "@/features/shell/module-page";
import { Dashboard } from "@/features/dashboard/dashboard";
import { TrackingWorkspace } from '@/features/tracking/workspace';
import { entities,trackingModules } from '@/features/tracking/config';
export const dynamic = "force-dynamic";
export default async function DemoPage({ params,searchParams }: { params: Promise<{ module?: string[] }>;searchParams:Promise<Record<string,string|undefined>> }) {
  if (!demoEnabled(process.env)) notFound();
  let palette;try{const saved=paletteSchema.safeParse(JSON.parse((await cookies()).get('pluto-demo-palette')?.value??'null'));if(saved.success)palette=saved.data}catch{}
  const query=await searchParams;
  const segments = (await params).module ?? [];
  if (segments.length > 1) notFound();
  const selected = findModule(segments[0] ?? "dashboard");
  if (!selected) notFound();
  return <AppearanceProvider initial={palette}><Shell active={selected.slug} demo>{selected.slug === "dashboard" ? <Dashboard demo /> : trackingModules.includes(selected.slug) ? <TrackingWorkspace key={[selected.slug,query.type??'',query.record??''].join(':')} module={selected.slug} demo initialKey={entities.find(e=>e.module===selected.slug&&e.key===query.type)?.key} initialFilters={query.record&&/^[0-9a-f-]{36}$/.test(query.record)?{recordId:query.record}:undefined}/> : <ModulePage slug={selected.slug} demo />}</Shell></AppearanceProvider>;
}
