CREATE POLICY owner_app_data_delete ON "User" FOR DELETE USING((SELECT auth.uid())=id);
CREATE POLICY security_audit_insert ON "AuditLog" FOR INSERT WITH CHECK((SELECT auth.uid())="userId" AND action LIKE 'security.%' AND outcome='success');
CREATE POLICY security_audit_read ON "AuditLog" FOR SELECT USING((SELECT auth.uid())="userId" AND action LIKE 'security.%');
