"use client";
import { useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, Bell, BookOpen, BriefcaseBusiness, CalendarDays, ChevronLeft, CircleHelp, Command, FolderKanban, LayoutDashboard, Menu, NotebookPen, Settings, ShieldCheck, Sparkles, Target, Wallet, X } from "lucide-react";
import { navigation, type ModuleSlug } from "./navigation";
import { signOut } from "@/features/auth/actions";
import { InterfaceClock } from "./interface-clock";
const icons = { dashboard: LayoutDashboard, finances: Wallet, education: BookOpen, calendar: CalendarDays, career: BriefcaseBusiness, projects: FolderKanban, goals: Target, notes: NotebookPen, assistant: Sparkles, notifications: Bell, settings: Settings };
export function Shell({ children, active, demo }: { children: React.ReactNode; active: ModuleSlug; demo: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const href = (slug: string) => demo ? `/demo/${slug}` : slug === "dashboard" ? "/" : `/${slug}`;
  return <div className={`app-shell ${active === "dashboard" ? "dashboard-shell" : ""} ${collapsed ? "sidebar-collapsed" : ""}`}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    {mobile && <button className="nav-backdrop" onClick={() => setMobile(false)} aria-label="Close navigation" />}
    <aside className={`sidebar ${mobile ? "mobile-open" : ""}`} aria-label="Primary navigation">
      <Link href={href("dashboard")} className="brand"><span className="brand-mark"><Command size={22} /></span><span className="nav-copy">JARVIS<span className="brand-sub">PERSONAL COMMAND CENTER</span></span></Link>
      <button className="mobile-close icon-button" onClick={() => setMobile(false)} aria-label="Close navigation"><X size={20} /></button>
      <nav>{["Overview", "Workspace", "System"].map(group => <div className="nav-group" key={group}><p className="nav-caption nav-copy">{group}</p>{navigation.filter(item => item.group === group).map(item => { const Icon = icons[item.slug]; return <Link key={item.slug} href={href(item.slug)} title={item.label} onClick={() => setMobile(false)} className={`nav-item ${active === item.slug ? "active" : ""}`} aria-current={active === item.slug ? "page" : undefined}><Icon size={18} /><span className="nav-copy">{item.label}</span>{item.slug === "assistant" && <span className="nav-copy nav-tag">AI</span>}</Link>; })}</div>)}</nav>
      <div className="sidebar-footer"><div className="privacy-line"><ShieldCheck size={17} /><span className="nav-copy">Private by design</span></div><button className="collapse-button" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed}><ChevronLeft size={17} /><span className="nav-copy">Collapse sidebar</span></button></div>
    </aside>
    <div className="workspace"><header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" onClick={() => setMobile(true)} aria-label="Open navigation" aria-expanded={mobile}><Menu size={22} /></button><span>Workspace</span><span className="slash">/</span><strong>{navigation.find(item => item.slug === active)?.label}</strong></div><InterfaceClock /><div className="topbar-actions"><span className="status-dot" /><span className="status-label">{demo ? "Synthetic preview" : "Owner workspace"}</span><Link href={href("notifications")} aria-label="Notifications" className="icon-button"><Bell size={18} /></Link><span className="avatar" aria-label={demo ? "Demo profile" : "Owner profile"}>{demo ? "D" : "J"}</span></div></header>
      <main id="main-content" tabIndex={-1}><div className="mode-banner"><ShieldCheck size={15} /><span>{demo ? "DEMONSTRATION MODE — All figures and records are synthetic. No services connected." : "PRIVATE WORKSPACE — Foundation preview. No external integrations connected."}</span></div>{children}</main>
      <footer className="workspace-footer"><span><Activity size={13} /> JARVIS · Foundation v0.1</span><span>{demo ? <Link href="/login">Owner sign in <ArrowUpRight size={12} /></Link> : <form action={signOut}><button type="submit">Sign out</button></form>}<CircleHelp size={14} aria-hidden="true" /></span></footer>
    </div>
  </div>;
}
