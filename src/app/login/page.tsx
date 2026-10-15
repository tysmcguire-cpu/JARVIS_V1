import Link from "next/link";
import { Command, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn } from "@/features/auth/actions";
import { getAuthConfig } from "@/lib/env";
import { demoEnabled } from "@/features/auth/policy";
import { CommandCore } from "@/components/ui/command-core";
export const dynamic = "force-dynamic";
export default async function Login({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const configured = !!getAuthConfig();
  const status = (await searchParams).status;
  return <main className="login-screen"><div className="login-instrument"><p className="instrument-label">JARVIS / PERSONAL OPERATING SYSTEM</p><CommandCore compact /><p className="login-instrument-caption">YOUR WORLD. ONE PRIVATE INTERFACE.</p></div><section className="login-card"><div className="login-brand"><Command size={26} /> JARVIS</div><p className="eyebrow">SECURE OWNER ACCESS / 01</p><h1>Welcome back.</h1><p className="subtitle">A focused space for everything that matters.</p>{!configured ? <div className="login-notice" role="status">Setup required. Configure Supabase and the approved owner UUID in your local environment. Private access is locked until configuration is complete.</div> : <><form action={signIn} className="login-form"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required maxLength={254} /><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} /><Button type="submit">Sign in securely</Button></form>{status && <p className="login-notice" role="alert">Unable to sign in. Check your credentials and approved owner configuration.</p>}</>}{demoEnabled(process.env) && <Button asChild variant="outline"><Link href="/demo">Explore synthetic demo</Link></Button>}<p className="login-footnote"><ShieldCheck size={15} /> Single owner access · No public registration</p></section><span className="login-version">JARVIS // FOUNDATION V0.1</span></main>;
}
