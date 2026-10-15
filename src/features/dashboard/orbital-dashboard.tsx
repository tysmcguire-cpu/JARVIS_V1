"use client";
import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, Bell, BookOpen, BriefcaseBusiness, CalendarDays, FolderKanban, Network, NotebookPen, Pause, Play, Settings, ShieldCheck, Sparkles, Target, Wallet } from "lucide-react";
import { FlowingCore } from "@/components/ui/flowing-core";
import { navigation } from "@/features/shell/navigation";

const modules = [
  { slug: "finances", icon: Wallet, detail: "Accounts, spending & budgets", phase: "02", side: "left", x: 17, y: 17 },
  { slug: "education", icon: BookOpen, detail: "Courses, assignments & study", phase: "02", side: "left", x: 12, y: 34 },
  { slug: "calendar", icon: CalendarDays, detail: "Your schedule & upcoming tasks", phase: "02", side: "left", x: 10, y: 51 },
  { slug: "career", icon: BriefcaseBusiness, detail: "Applications, contacts & opportunities", phase: "02", side: "left", x: 12, y: 68 },
  { slug: "projects", icon: FolderKanban, detail: "Ideas, milestones & pursuits", phase: "02", side: "left", x: 17, y: 85 },
  { slug: "goals", icon: Target, detail: "Personal goals, habits & progress", phase: "02", side: "right", x: 83, y: 17 },
  { slug: "notes", icon: NotebookPen, detail: "Notes & your knowledge base", phase: "02", side: "right", x: 88, y: 34 },
  { slug: "assistant", icon: Sparkles, detail: "Grounded analysis · planned", phase: "05", side: "right", x: 90, y: 51 },
  { slug: "notifications", icon: Bell, detail: "Reminders & reviews · planned", phase: "06", side: "right", x: 88, y: 68 },
  { slug: "settings", icon: Settings, detail: "Your preferences & connection status", phase: "01", side: "right", x: 83, y: 85 }
] as const;

export function OrbitalDashboard({ demo }: { demo: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const focused = modules.find(module => module.slug === selected);
  const label = (slug: string) => navigation.find(module => module.slug === slug)!.label;
  const href = (slug: string) => demo ? `/demo/${slug}` : `/${slug}`;
  return <div className={`orbital-dashboard ${paused ? "motion-paused" : ""}`}>
    <header className="orbital-heading"><div><p className="eyebrow"><span className="eyebrow-marker" /> PERSONAL OPERATING SYSTEM / 01</p><h1>Command Center<span className="heading-period">.</span></h1></div><button className="motion-control" onClick={() => setPaused(!paused)} aria-label={paused ? "Resume interface animations" : "Pause interface animations"} aria-pressed={paused}>{paused ? <Play size={13} /> : <Pause size={13} />}<span>{paused ? "Motion paused" : "Pause motion"}</span></button></header>
    <section className="orbital-console" aria-label="JARVIS command hub">
      <div className="console-corner corner-nw" aria-hidden="true" /><div className="console-corner corner-ne" aria-hidden="true" /><div className="console-corner corner-sw" aria-hidden="true" /><div className="console-corner corner-se" aria-hidden="true" />
      <div className="console-topline"><span><ShieldCheck size={12} /> {demo ? "SYNTHETIC ENVIRONMENT" : "PRIVATE OWNER WORKSPACE"}</span><span className="console-decorative" aria-hidden="true">INTERFACE / FOUNDATION 01</span></div>
      <div className="orbital-field">
        <svg className="hub-connections" viewBox="0 0 1000 640" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <ellipse cx="500" cy="326" rx="300" ry="283" className="hub-boundary" strokeDasharray="1 9" />
          <ellipse cx="500" cy="326" rx="226" ry="223" className="hub-boundary-inner" />
          {modules.map(module => { const x=module.x*10; const y=module.y*6.4; const endX=module.side === "left" ? 355 : 645; const middleX=module.side === "left" ? 310 : 690; return <g key={module.slug} className={`hub-wire ${selected === module.slug ? "wire-selected" : ""}`}><path d={`M${x} ${y} H${middleX} L${endX} 326`} /><path className="wire-packet" d={`M${x} ${y} H${middleX} L${endX} 326`} style={{ animationDelay: `${module.y / 18}s` }} /><circle cx={middleX} cy={y} r="2.3" /></g>; })}
          <path d="M500 23V66M500 585v34M268 326h-18M732 326h18" className="hub-crosshair" />
        </svg>
        <div className="hub-dust" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ "--particle-angle": `${i * 15}deg`, "--particle-delay": `${i * .27}s` } as CSSProperties} />)}</div>
        <div className="hub-center">
          <FlowingCore paused={paused} />
          <div className="hub-selection" aria-live="polite"><span className="hub-selection-caption">{focused ? "WORKSPACE DESTINATION" : "SELECT A WORKSPACE"}</span><strong>{focused ? label(focused.slug) : "Your world. Within reach."}</strong><p>{focused ? focused.detail : "Choose any module surrounding the core."}</p></div>
        </div>
        <nav className="orbital-modules" aria-label="Workspace modules">
          {modules.map((module, index) => { const Icon = module.icon; return <Link key={module.slug} href={href(module.slug)} aria-label={`Open ${label(module.slug)}`} className={`orbit-module orbit-${module.side} ${selected === module.slug ? "module-selected" : ""}`} style={{ "--module-x": `${module.x}%`, "--module-y": `${module.y}%`, "--module-delay": `${index * 45}ms` } as CSSProperties} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setPaused(true); }} onMouseEnter={() => setSelected(module.slug)} onMouseLeave={() => setSelected(null)} onFocus={() => setSelected(module.slug)} onBlur={() => setSelected(null)}>
            <span className="orbit-module-icon"><Icon size={21} /></span><span className="orbit-module-copy"><span className="orbit-module-index">{String(index + 1).padStart(2, "0")} / {module.phase === "01" ? "FOUNDATION" : `PLANNED · PHASE ${module.phase}`}</span><strong>{label(module.slug)}</strong><span className="orbit-module-detail">{module.detail}</span><span className="module-trace" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></span></span><ArrowUpRight className="orbit-module-arrow" size={14} /><span className="module-port" aria-hidden="true" />
          </Link>; })}
        </nav>
      </div>
      <div className="console-bottomline"><span><Network size={12} /> 10 WORKSPACE DESTINATIONS</span><span>NO DOMAIN INTEGRATIONS CONNECTED</span><div className="signal-decoration" aria-hidden="true">{Array.from({ length: 27 }, (_, i) => <i key={i} style={{ "--signal-height": `${5 + (i * 7 % 19)}px`, animationDelay: `${i * .1}s` } as CSSProperties} />)}</div></div>
    </section>
    <p className="hub-footnote">{demo ? "Synthetic preview. Navigation is functional; future modules are clearly marked as planned." : "Your workspace is private. Tracking modules arrive in Phase 2; AI and notification delivery follow in later phases."}</p>
  </div>;
}
