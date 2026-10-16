CREATE TABLE "AiConversation" (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
 question VARCHAR(1000) NOT NULL, query JSONB NOT NULL, answer JSONB,
 status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','complete','failed')),
 "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(), UNIQUE(id,"userId"),
 CHECK ((status='complete')=(answer IS NOT NULL))
);
CREATE INDEX "AiConversation_owner_created" ON "AiConversation"("userId","createdAt");
CREATE TABLE "AiSourceReference" (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
 "conversationId" UUID NOT NULL, reference VARCHAR(150) NOT NULL, label VARCHAR(300) NOT NULL, href VARCHAR(300) NOT NULL,
 "sourceUpdatedAt" TIMESTAMPTZ(6) NOT NULL, "fetchedAt" TIMESTAMPTZ(6) NOT NULL,
 FOREIGN KEY("conversationId","userId") REFERENCES "AiConversation"(id,"userId") ON DELETE CASCADE,
 UNIQUE("conversationId",reference), CHECK(href ~ '^/[a-z]*$')
);
CREATE INDEX "AiSourceReference_owner" ON "AiSourceReference"("userId","conversationId");
ALTER TABLE "AiConversation" ENABLE ROW LEVEL SECURITY;ALTER TABLE "AiConversation" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AiSourceReference" ENABLE ROW LEVEL SECURITY;ALTER TABLE "AiSourceReference" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON "AiConversation","AiSourceReference" FROM anon,authenticated;
CREATE POLICY assistant_owner ON "AiConversation" FOR ALL USING((SELECT auth.uid())="userId") WITH CHECK((SELECT auth.uid())="userId");
CREATE POLICY assistant_owner ON "AiSourceReference" FOR ALL USING((SELECT auth.uid())="userId") WITH CHECK((SELECT auth.uid())="userId");
CREATE POLICY assistant_audit ON "AuditLog" FOR INSERT WITH CHECK((SELECT auth.uid())="userId" AND action LIKE 'assistant.%' AND outcome='success');
CREATE POLICY assistant_request_read ON "AuditLog" FOR SELECT USING((SELECT auth.uid())="userId" AND action='assistant.request');
