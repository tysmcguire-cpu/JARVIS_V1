ALTER TABLE "UserSettings" ADD COLUMN background varchar(10) NOT NULL DEFAULT 'current';
ALTER TABLE "UserSettings" ADD CONSTRAINT settings_background CHECK (background IN ('current','black','white'));
