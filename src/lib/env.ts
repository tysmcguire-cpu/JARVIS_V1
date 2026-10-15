import "server-only";
import { z } from "zod";
const authSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().refine(value => value.startsWith("https://") || value.startsWith("http://127.0.0.1:") || value.startsWith("http://localhost:")),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  JARVIS_OWNER_ID: z.uuid()
});
export function getAuthConfig() {
  const parsed = authSchema.safeParse(process.env);
  return parsed.success ? parsed.data : null;
}
