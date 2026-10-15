-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "singleton" BOOLEAN NOT NULL DEFAULT true,
    "displayName" VARCHAR(100) NOT NULL DEFAULT 'Owner',
    "synthetic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "userId" UUID NOT NULL,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'America/Chicago',
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "weeklyReviewEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReviewDay" INTEGER NOT NULL DEFAULT 0,
    "weeklyReviewTime" VARCHAR(5) NOT NULL DEFAULT '18:00',
    "deadlineReminders" BOOLEAN NOT NULL DEFAULT true,
    "financialAlerts" BOOLEAN NOT NULL DEFAULT true,
    "morningBriefingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "morningBriefingTime" VARCHAR(5) NOT NULL DEFAULT '08:00',
    "unsolicitedAiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "outcome" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_singleton_key" ON "User"("singleton");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Supabase-specific identity boundary. Provision the only owner manually.
ALTER TABLE "User" ADD CONSTRAINT "User_auth_identity_fkey"
  FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_singleton_true" CHECK ("singleton" = true);
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_weekday" CHECK ("weeklyReviewDay" BETWEEN 0 AND 6);
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_weekly_time" CHECK ("weeklyReviewTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_morning_time" CHECK ("morningBriefingTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_currency" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "User", "UserSettings", "AuditLog" FROM anon, authenticated;
GRANT SELECT ON TABLE "User", "UserSettings", "AuditLog" TO authenticated;
CREATE POLICY "owner_read_user" ON "User" FOR SELECT TO authenticated USING ((SELECT auth.uid()) = "id");
CREATE POLICY "owner_read_settings" ON "UserSettings" FOR SELECT TO authenticated USING ((SELECT auth.uid()) = "userId");
CREATE POLICY "owner_read_audit" ON "AuditLog" FOR SELECT TO authenticated USING ((SELECT auth.uid()) = "userId");
