ALTER TABLE "UserSettings" ADD COLUMN "wordmarkStyle" varchar(20) NOT NULL DEFAULT 'original';
ALTER TABLE "UserSettings" ADD CONSTRAINT settings_wordmark_style CHECK ("wordmarkStyle" IN ('original','dotted','modern','condensed','terminal','wide','bold','italic','serif','slab','rounded','outline'));
