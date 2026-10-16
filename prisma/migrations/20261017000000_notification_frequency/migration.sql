ALTER TABLE "NotificationRule" ADD COLUMN config JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "NotificationRule" ADD CONSTRAINT "NotificationRule_config_object" CHECK(jsonb_typeof(config)='object');
ALTER TABLE "NotificationRule" DROP CONSTRAINT "NotificationRule_kind_check";
ALTER TABLE "NotificationRule" ADD CONSTRAINT "NotificationRule_kind_check" CHECK(kind IN('weekly','deadline','financial','morning','reminder'));
CREATE INDEX "NotificationJob_userId_entity_recordId_idx" ON "NotificationJob"("userId",entity,"recordId");
