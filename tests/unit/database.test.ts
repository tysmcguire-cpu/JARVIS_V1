import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
const owner = "a2c92111-c2a3-4ab2-91dc-3d1abc84cc33";
const other = "b2c92111-c2a3-4ab2-91dc-3d1abc84cc33";
let db: PGlite;
describe("foundation SQL migration on embedded PostgreSQL", () => {
  beforeAll(async () => {
    db = new PGlite();
    // Supabase-owned prerequisites are emulated only in this isolated test.
    await db.exec(`CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated;
      GRANT USAGE ON SCHEMA public, auth TO anon, authenticated;
      CREATE TABLE auth.users (id uuid PRIMARY KEY);
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      INSERT INTO auth.users VALUES ('${owner}'), ('${other}');`);
    await db.exec(readFileSync("prisma/migrations/20261015000000_foundation/migration.sql", "utf8"));
    await db.query('INSERT INTO "User" (id, "updatedAt") VALUES ($1, now())', [owner]);
    await db.query('INSERT INTO "UserSettings" ("userId", "updatedAt") VALUES ($1, now())', [owner]);
  }, 30000);
  afterAll(async () => { await db?.close(); });
  it("stores the exact inactive briefing and enabled weekly defaults", async () => {
    const result = await db.query<Record<string, unknown>>('SELECT * FROM "UserSettings"');
    expect(result.rows[0]).toMatchObject({ timezone: "America/Chicago", weeklyReviewEnabled: true, weeklyReviewDay: 0, weeklyReviewTime: "18:00", deadlineReminders: true, financialAlerts: true, morningBriefingEnabled: false, morningBriefingTime: "08:00", unsolicitedAiEnabled: false });
  });
  it("rejects another owner, invalid schedule and an unregistered auth identity", async () => {
    await expect(db.query('INSERT INTO "User" (id, "updatedAt") VALUES ($1, now())', [other])).rejects.toThrow();
    await expect(db.query('UPDATE "User" SET singleton=false')).rejects.toThrow();
    await expect(db.query('UPDATE "UserSettings" SET "weeklyReviewTime"=$1', ["25:00"])).rejects.toThrow();
    await expect(db.query('UPDATE "UserSettings" SET "weeklyReviewDay"=7')).rejects.toThrow();
    await expect(db.query('UPDATE "User" SET id=$1', ["c2c92111-c2a3-4ab2-91dc-3d1abc84cc33"])).rejects.toThrow();
  });
  it("denies anonymous reads and filters second-user reads with RLS", async () => {
    try {
      await db.exec("SET ROLE anon");
      await expect(db.query('SELECT * FROM "UserSettings"')).rejects.toThrow();
    } finally { await db.exec("RESET ROLE"); }
    try {
      await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub = '${other}'`);
      expect((await db.query('SELECT * FROM "UserSettings"')).rows).toHaveLength(0);
      await db.exec(`SET request.jwt.claim.sub = '${owner}'`);
      expect((await db.query('SELECT * FROM "UserSettings"')).rows).toHaveLength(1);
      await expect(db.query('UPDATE "UserSettings" SET "weeklyReviewDay"=1')).rejects.toThrow();
    } finally { await db.exec("RESET ROLE"); }
  });
  it("cascades owner deletion from Supabase identity", async () => {
    await db.query('DELETE FROM auth.users WHERE id=$1', [owner]);
    expect((await db.query('SELECT * FROM "User"')).rows).toHaveLength(0);
    expect((await db.query('SELECT * FROM "UserSettings"')).rows).toHaveLength(0);
  });
});
