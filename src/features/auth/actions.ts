"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthConfig } from "@/lib/env";
import { createAuthClient } from "@/lib/supabase/server";
import { isOwner } from "./policy";
const credentials = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) });
export async function signIn(form: FormData) {
  if (!getAuthConfig()) redirect("/login?status=configuration");
  const input = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!input.success) redirect("/login?status=invalid");
  const client = await createAuthClient();
  const { data, error } = await client.auth.signInWithPassword(input.data);
  if (error || !isOwner(data.user?.id, process.env.JARVIS_OWNER_ID)) {
    await client.auth.signOut();
    redirect("/login?status=invalid");
  }
  redirect("/");
}
export async function signOut() {
  const client = await createAuthClient();
  const { error } = await client.auth.signOut();
  if (error) throw new Error("Sign out failed. Please try again.");
  redirect("/login");
}
