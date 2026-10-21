import { notFound, redirect } from "next/navigation";
import { findModule } from "@/features/shell/navigation";
import { ModulePage } from "@/features/shell/module-page";
import { Shell } from "@/features/shell/shell";
import { readSettings } from "@/features/settings/repository";
import { TrackingWorkspace } from '@/features/tracking/workspace';
import { entities,initialTrackingKey, trackingModules } from '@/features/tracking/config';
import { readWorkspace } from '@/features/tracking/repository';
import {AssistantPanel} from '@/features/assistant/panel';
import {history} from '@/features/assistant/repository';
import {NotificationPanel} from '@/features/notifications/panel';
import {notificationState} from '@/features/notifications/repository';
export default async function Page({ params,searchParams }: { params: Promise<{ module: string }>;searchParams:Promise<Record<string,string|undefined>> }) {
  const slug = (await params).module;
  if (slug === "dashboard") redirect("/");
  const selected = findModule(slug);
  if (!selected) notFound();
  if(slug==='assistant')return <Shell active="assistant" demo={false}><AssistantPanel demo={false} initial={await history()}/></Shell>;
  if(slug==='notifications')return <Shell active="notifications" demo={false}><NotificationPanel demo={false} initial={await notificationState()}/></Shell>;
  if (trackingModules.includes(slug)) {
    const q=await searchParams;const first=entities.find(e=>e.module===slug&&e.key===q.type)?.key??initialTrackingKey(slug);const filter={...(q.record&&/^[0-9a-f-]{36}$/.test(q.record)?{recordId:q.record}:{}),...(q.course&&/^[0-9a-f-]{36}$/.test(q.course)?{courseId:q.course}:{})};
    const initial = await readWorkspace(first, slug==='finances'?{pageSize:12,period:!filter.recordId,...filter}:{pageSize:12,...filter});
    return <Shell active={selected.slug} demo={false}><TrackingWorkspace key={[slug,first,q.record??'',q.course??''].join(':')} module={slug} demo={false} initial={initial} initialKey={first} initialFilters={filter} /></Shell>;
  }
  const settings = selected.slug === "settings" ? await readSettings() : undefined;
  return <Shell active={selected.slug} demo={false}><ModulePage slug={selected.slug} demo={false} settings={settings} /></Shell>;
}
