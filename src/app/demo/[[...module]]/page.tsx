import { notFound } from "next/navigation";
import { demoEnabled } from "@/features/auth/policy";
import { findModule } from "@/features/shell/navigation";
import { Shell } from "@/features/shell/shell";
import { ModulePage } from "@/features/shell/module-page";
import { Dashboard } from "@/features/dashboard/dashboard";
export const dynamic = "force-dynamic";
export default async function DemoPage({ params }: { params: Promise<{ module?: string[] }> }) {
  if (!demoEnabled(process.env)) notFound();
  const segments = (await params).module ?? [];
  if (segments.length > 1) notFound();
  const selected = findModule(segments[0] ?? "dashboard");
  if (!selected) notFound();
  return <Shell active={selected.slug} demo>{selected.slug === "dashboard" ? <Dashboard demo /> : <ModulePage slug={selected.slug} demo />}</Shell>;
}
