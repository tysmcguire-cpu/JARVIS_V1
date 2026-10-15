import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAuthConfig } from "@/lib/env";
export async function createAuthClient() {
  const config = getAuthConfig();
  if (!config) throw new Error("Authentication configuration is incomplete.");
  const store = await cookies();
  return createServerClient(config.NEXT_PUBLIC_SUPABASE_URL, config.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: values => {
        // Server Components cannot write cookies; proxy refreshes them instead.
        try { values.forEach(({ name, value, options }) => store.set(name, value, { ...options, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" })); } catch { /* read-only render */ }
      }
    }
  });
}
