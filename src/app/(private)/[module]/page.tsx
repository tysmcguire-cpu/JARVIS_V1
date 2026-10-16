import { notFound, redirect } from "next/navigation";
import { findModule } from "@/features/shell/navigation";
import { ModulePage } from "@/features/shell/module-page";
import { Shell } from "@/features/shell/shell";
import { readSettings } from "@/features/settings/repository";
import { TrackingWorkspace } from '@/features/tracking/workspace';
import { entities, trackingModules } from '@/features/tracking/config';
import { readWorkspace } from '@/features/tracking/repository';
import {AssistantPanel} from '@/features/assistant/panel';
import {history} from '@/features/assistant/repository';
export default async function Page({ params }: { params: Promise<{ module: string }> }) {
  const slug = (await params).module;
  if (slug === "dashboard") redirect("/");
  const selected = findModule(slug);
  if (!selected) notFound();
  if(slug==='assistant')return <Shell active="assistant" demo={false}><AssistantPanel demo={false} initial={await history()}/></Shell>;
  if (trackingModules.includes(slug)) {
    const first = entities.find(e => e.module === slug)!;
    const initial = await readWorkspace(first.key, {});
    return <Shell active={selected.slug} demo={false}><TrackingWorkspace key={slug} module={slug} demo={false} initial={initial} /></Shell>;
  }
  const settings = selected.slug === "settings" ? await readSettings() : undefined;
  return <Shell active={selected.slug} demo={false}><ModulePage slug={selected.slug} demo={false} settings={settings} /></Shell>;
}
