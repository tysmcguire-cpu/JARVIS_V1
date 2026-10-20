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
import { trackingModules } from '@/features/tracking/config';
export const dynamic = "force-dynamic";
export default async function DemoPage({ params }: { params: Promise<{ module?: string[] }> }) {
  if (!demoEnabled(process.env)) notFound();
  let palette;try{const saved=paletteSchema.safeParse(JSON.parse((await cookies()).get('jarvis-demo-palette')?.value??'null'));if(saved.success)palette=saved.data}catch{}
  const segments = (await params).module ?? [];
  if (segments.length > 1) notFound();
  const selected = findModule(segments[0] ?? "dashboard");
  if (!selected) notFound();
  return <AppearanceProvider initial={palette}><Shell active={selected.slug} demo>{selected.slug === "dashboard" ? <Dashboard demo /> : trackingModules.includes(selected.slug) ? <TrackingWorkspace key={selected.slug} module={selected.slug} demo /> : <ModulePage slug={selected.slug} demo />}</Shell></AppearanceProvider>;
}
