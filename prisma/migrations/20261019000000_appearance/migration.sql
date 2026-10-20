ALTER TABLE "UserSettings" ADD COLUMN "primaryColor" varchar(7) NOT NULL DEFAULT '#69d8f3', ADD COLUMN "secondaryColor" varchar(7) NOT NULL DEFAULT '#b1a0ff';
ALTER TABLE "UserSettings" ADD CONSTRAINT "settings_primary_color" CHECK ("primaryColor" ~ '^#[0-9a-fA-F]{6}$'), ADD CONSTRAINT "settings_secondary_color" CHECK ("secondaryColor" ~ '^#[0-9a-fA-F]{6}$');
CREATE POLICY appearance_audit_insert ON "AuditLog" FOR INSERT WITH CHECK((SELECT auth.uid())="userId" AND action='settings.appearance.update' AND outcome='success');
