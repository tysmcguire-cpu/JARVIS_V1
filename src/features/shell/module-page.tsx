import { SettingsPanels } from "@/features/telegram/settings-panels";
import {AssistantPanel} from '@/features/assistant/panel';
import {NotificationPanel} from '@/features/notifications/panel';
import type { UserSettings } from "@prisma/client";
import { findModule, type ModuleSlug } from "./navigation";
const phases: Partial<Record<ModuleSlug, string>> = { assistant: "Phase 5", notifications: "Phase 6", settings: "Phase 1" };
export function ModulePage({ slug, demo, settings }: { slug: ModuleSlug; demo: boolean; settings?: UserSettings | null }) {
  if(slug==='assistant')return <AssistantPanel demo={demo}/>;
  if(slug==='notifications')return <NotificationPanel demo={demo}/>;
  const moduleInfo = findModule(slug)!;
  const demoPreferences = [["Timezone", "America/Chicago"], ["Weekly review", "Enabled · Sunday 18:00"], ["Deadline reminders", "Enabled"], ["Financial alerts", "Enabled"], ["Morning briefing", "Disabled · inactive time 08:00"], ["Unsolicited AI recommendations", "Disabled"]];
  const enabled = (value: boolean) => value ? "Enabled" : "Disabled";
  const preferences = demo ? demoPreferences : settings ? [
    ["Timezone", settings.timezone],
    ["Weekly review", `${enabled(settings.weeklyReviewEnabled)} · ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][settings.weeklyReviewDay]} ${settings.weeklyReviewTime}`],
    ["Deadline reminders", enabled(settings.deadlineReminders)],
    ["Financial alerts", enabled(settings.financialAlerts)],
    ["Morning briefing", `${enabled(settings.morningBriefingEnabled)} · ${settings.morningBriefingEnabled ? "scheduled" : "inactive time"} ${settings.morningBriefingTime}`],
    ["Unsolicited AI recommendations", enabled(settings.unsolicitedAiEnabled)]
  ] : [];
  return <>
    <div className="page-heading"><div><p className="eyebrow">JARVIS WORKSPACE</p><h1>{moduleInfo.label}</h1><p className="subtitle">{slug === "settings" ? "Connection status and initial workspace preferences." : "A dedicated space for the next stage of your personal operating system."}</p></div></div>
    {slug === "settings" ? <SettingsPanels demo={demo}>
      <section className="panel"><div className="panel-heading"><h2>Notification preferences</h2></div><dl className="preferences">{preferences.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <p className="settings-note">{demo ? "Synthetic defaults shown for reference." : settings ? "Preferences loaded from your owner-scoped database record." : "No settings record exists. Run the documented owner provisioning command."} Manage schedules and delivery in Notifications. Background delivery requires an activated worker; Telegram alerts require explicit opt-in.</p>
      </section>
      <section className="panel"><div className="panel-heading"><h2>Connections</h2></div><dl className="preferences">{["Google Calendar", "Gmail", "GitHub", "Canvas LMS", "Google Drive", "Financial accounts", "Telegram", "OpenAI"].map(name => <div key={name}><dt>{name}</dt><dd>{name === "Telegram" ? "Manage in Telegram tab" : name === "Financial accounts" ? "Manual entries and CSV" : name === "OpenAI" ? "Manage in Assistant" : "Manage in Integrations tab"}</dd></div>)}</dl><p className="settings-note">{demo ? "Synthetic preview is isolated from all owner data." : "Supabase identity verified for this session. Manage read-only sources in the Integrations tab."}</p></section>
    </SettingsPanels> : <section className="panel empty-state"><span className="small-badge">Planned · {phases[slug] ?? "Phase 2"}</span><h2>Your {moduleInfo.label.toLowerCase()} space is ready to grow.</h2><p>Navigation and access protection are in place. This module has no data entry or external actions in Foundation.</p></section>}
  </>;
}
