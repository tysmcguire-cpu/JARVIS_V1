import "server-only";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/server";
import { getAuthConfig } from "@/lib/env";
import { isOwner } from "./policy";
export async function requireOwner() {
  if (!getAuthConfig()) redirect("/login?status=configuration");
  const client = await createAuthClient();
  const { data, error } = await client.auth.getUser();
  if (error || !isOwner(data.user?.id, process.env.JARVIS_OWNER_ID)) redirect("/login?status=unauthorized");
  return data.user!;
}
