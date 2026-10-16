import "server-only";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/server";
import { getAuthConfig } from "@/lib/env";
import { isOwner } from "./policy";
import { cache } from 'react';
import {AsyncLocalStorage} from 'node:async_hooks';
import type {User} from '@supabase/supabase-js';
const ownerRequest=new AsyncLocalStorage<User>();
const verifyOwner=cache(async()=>{
  if (!getAuthConfig()) redirect("/login?status=configuration");
  const client = await createAuthClient();
  const { data, error } = await client.auth.getUser();
  if (error || !isOwner(data.user?.id, process.env.JARVIS_OWNER_ID)) redirect("/login?status=unauthorized");
  return data.user!;
});
export async function requireOwner() {
  return ownerRequest.getStore()??verifyOwner();
}
// Deduplicate only inside this verified action. Nothing is shared across requests.
export async function withOwnerRequest<T>(work:()=>Promise<T>):Promise<T>{
  const owner=await requireOwner();
  return ownerRequest.run(owner,work);
}
