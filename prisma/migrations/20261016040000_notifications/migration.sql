ALTER TABLE "UserSettings" ADD COLUMN "notificationTelegramEnabled" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "NotificationRule"(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
 kind VARCHAR(20) NOT NULL CHECK(kind IN('weekly','deadline','financial','morning')),version INTEGER NOT NULL DEFAULT 1,
 "thresholdMinor" BIGINT CHECK("thresholdMinor">0),currency CHAR(3) NOT NULL DEFAULT 'USD' CHECK(currency IN('USD','CAD','EUR','GBP')),
 "leadDays" INTEGER NOT NULL DEFAULT 1 CHECK("leadDays" BETWEEN 0 AND 30),time VARCHAR(5) NOT NULL DEFAULT '09:00' CHECK(time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 "lastScannedAt" TIMESTAMPTZ(6),"createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),UNIQUE("userId",kind),UNIQUE(id,"userId")
);
CREATE TABLE "NotificationJob"(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
 "ruleId" UUID NOT NULL,"ruleVersion" INTEGER NOT NULL,"dedupeKey" VARCHAR(200) NOT NULL,payload JSONB NOT NULL,
 entity VARCHAR(40),"recordId" UUID,"dueDate" DATE,
 status VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK(status IN('queued','delivered','failed','canceled')),
 attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),"maxAttempts" INTEGER NOT NULL DEFAULT 5 CHECK("maxAttempts">0),
 "scheduledAt" TIMESTAMPTZ(6) NOT NULL,"nextAttemptAt" TIMESTAMPTZ(6) NOT NULL,"expiresAt" TIMESTAMPTZ(6) NOT NULL,
 "leaseToken" UUID,"leaseUntil" TIMESTAMPTZ(6),"readAt" TIMESTAMPTZ(6),"createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
 FOREIGN KEY("ruleId","userId") REFERENCES "NotificationRule"(id,"userId") ON DELETE CASCADE,
 UNIQUE("userId","dedupeKey"),UNIQUE(id,"userId"),CHECK(("leaseToken" IS NULL)=("leaseUntil" IS NULL))
);
CREATE INDEX "NotificationJob_due" ON "NotificationJob"("userId",status,"nextAttemptAt");
CREATE TABLE "NotificationDelivery"(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,"jobId" UUID NOT NULL,
 channel VARCHAR(20) NOT NULL CHECK(channel IN('in_app','telegram')),attempt INTEGER NOT NULL CHECK(attempt>=0),
 outcome VARCHAR(20) NOT NULL CHECK(outcome IN('pending','delivered','failed')),code VARCHAR(40),"createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
 FOREIGN KEY("jobId","userId") REFERENCES "NotificationJob"(id,"userId") ON DELETE CASCADE,UNIQUE("jobId",channel,attempt)
);
CREATE INDEX "NotificationDelivery_owner" ON "NotificationDelivery"("userId","jobId");
ALTER TABLE "NotificationRule" ENABLE ROW LEVEL SECURITY;ALTER TABLE "NotificationRule" FORCE ROW LEVEL SECURITY;
ALTER TABLE "NotificationJob" ENABLE ROW LEVEL SECURITY;ALTER TABLE "NotificationJob" FORCE ROW LEVEL SECURITY;
ALTER TABLE "NotificationDelivery" ENABLE ROW LEVEL SECURITY;ALTER TABLE "NotificationDelivery" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON "NotificationRule","NotificationJob","NotificationDelivery" FROM anon,authenticated;
CREATE POLICY notification_owner ON "NotificationRule" FOR ALL USING((SELECT auth.uid())="userId") WITH CHECK((SELECT auth.uid())="userId");
CREATE POLICY notification_owner ON "NotificationJob" FOR ALL USING((SELECT auth.uid())="userId") WITH CHECK((SELECT auth.uid())="userId");
CREATE POLICY notification_owner ON "NotificationDelivery" FOR ALL USING((SELECT auth.uid())="userId") WITH CHECK((SELECT auth.uid())="userId");
CREATE POLICY notification_settings_update ON "UserSettings" FOR UPDATE USING((SELECT auth.uid())="userId") WITH CHECK((SELECT auth.uid())="userId");
CREATE POLICY notification_audit ON "AuditLog" FOR INSERT WITH CHECK((SELECT auth.uid())="userId" AND action LIKE 'notification.%' AND outcome='success');
