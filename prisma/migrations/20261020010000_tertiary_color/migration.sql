ALTER TABLE "UserSettings" ADD COLUMN "tertiaryColor" varchar(7) NOT NULL DEFAULT '#87a8bc';
ALTER TABLE "UserSettings" ADD CONSTRAINT settings_tertiary_color CHECK ("tertiaryColor" ~ '^#[0-9a-fA-F]{6}$');
