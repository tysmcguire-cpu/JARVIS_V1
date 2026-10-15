import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

// Run explicitly after reviewing/applying migrations. Never logs secret values.
process.loadEnvFile(".env");
const ownerId = z.uuid().parse(process.env.JARVIS_OWNER_ID);
const adminUrl = z.string().min(1).parse(process.env.DIRECT_URL);
const runtimeUrl = new URL(z.string().min(1).parse(process.env.DATABASE_URL));
const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });

async function provision() {
  const identity = await admin.$queryRaw<{ present: boolean }[]>`SELECT EXISTS(SELECT 1 FROM auth.users WHERE id=${ownerId}::uuid AND deleted_at IS NULL) AS present`;
  if (!identity[0]?.present) throw new Error("The configured owner does not exist in Supabase Auth.");
  const existing = await admin.user.findFirst({ select: { id: true, synthetic: true } });
  if (existing && (existing.id !== ownerId || existing.synthetic)) throw new Error("Existing owner differs or contains synthetic data; refusing to replace it.");

  const roles = await admin.$queryRaw<{ present: boolean }[]>`SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='jarvis_app') AS present`;
  const currentUsername = decodeURIComponent(runtimeUrl.username);
  const projectRef = currentUsername.split(".").at(-1);
  if (!projectRef || currentUsername === projectRef) throw new Error("Expected a Supabase shared-pooler runtime URL.");
  if (roles[0]?.present && !currentUsername.startsWith("jarvis_app.")) throw new Error("Runtime role already exists but its credentials are not configured; refusing to reset it.");
  const password = roles[0]?.present ? decodeURIComponent(runtimeUrl.password) : randomBytes(32).toString("hex");
  const statements = [
    "GRANT CONNECT ON DATABASE postgres TO jarvis_app",
    "GRANT USAGE ON SCHEMA public, auth TO jarvis_app",
    "GRANT EXECUTE ON FUNCTION auth.uid() TO jarvis_app",
    'GRANT SELECT ON TABLE public."User", public."UserSettings", public."AuditLog" TO jarvis_app'
  ];
  await admin.$transaction(async tx => {
    if (!roles[0]?.present) {
      // Password is generated locally as hex, never user-supplied SQL or output.
      if (!/^[0-9a-f]{64}$/.test(password)) throw new Error("Invalid generated password format.");
      await tx.$executeRawUnsafe(`CREATE ROLE jarvis_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS PASSWORD '${password}'`);
    }
    for (const sql of statements) await tx.$executeRawUnsafe(sql);
    for (const [table, column] of [["User", "id"], ["UserSettings", "userId"], ["AuditLog", "userId"]] as const) {
      const policies = await tx.$queryRaw<{ present: boolean }[]>`SELECT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=${table} AND policyname='jarvis_runtime_owner_read') AS present`;
      if (!policies[0]?.present) await tx.$executeRawUnsafe(`CREATE POLICY jarvis_runtime_owner_read ON public."${table}" FOR SELECT TO jarvis_app USING ((SELECT auth.uid()) = "${column}")`);
    }
    await tx.user.upsert({ where: { id: ownerId }, update: {}, create: { id: ownerId, settings: { create: {} } } });
    await tx.userSettings.upsert({ where: { userId: ownerId }, update: {}, create: { userId: ownerId } });
  });

  if (!roles[0]?.present) {
    runtimeUrl.username = `jarvis_app.${projectRef}`;
    runtimeUrl.password = password;
    const contents = readFileSync(".env", "utf8");
    writeFileSync(".env", contents.replace(/^(\s*DATABASE_URL\s*=)[^\r\n]*/m, (_, prefix) => `${prefix}"${runtimeUrl.toString()}"`));
  }
  console.info("Owner/settings provisioned. Runtime role uses SELECT-only owner-scoped access; migration credentials remain separate. Secrets were not displayed.");
}
provision().catch(() => { console.error("Owner provisioning failed; private error details suppressed. Check identity, migrations and role setup."); process.exitCode = 1; }).finally(() => admin.$disconnect());
