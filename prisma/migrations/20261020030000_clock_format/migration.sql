ALTER TABLE "UserSettings" ADD COLUMN "clockFormat" varchar(3) NOT NULL DEFAULT '24h';
ALTER TABLE "UserSettings" ADD CONSTRAINT settings_clock_format CHECK ("clockFormat" IN ('12h','24h'));
