import { notFound, redirect } from "next/navigation";
import { findModule } from "@/features/shell/navigation";
import { ModulePage } from "@/features/shell/module-page";
import { Shell } from "@/features/shell/shell";
export default async function Page({ params }: { params: Promise<{ module: string }> }) {
  const slug = (await params).module;
  if (slug === "dashboard") redirect("/");
  const selected = findModule(slug);
  if (!selected) notFound();
  return <Shell active={selected.slug} demo={false}><ModulePage slug={selected.slug} demo={false} /></Shell>;
}
