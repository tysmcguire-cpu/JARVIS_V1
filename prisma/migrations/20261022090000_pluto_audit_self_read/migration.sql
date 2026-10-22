-- pluto_app already has SELECT/INSERT grants, but no SELECT policy applied
-- to that role. Prisma INSERT ... RETURNING needs the inserted row visible.
-- Keep browser roles revoked and allow only active customers' own audit rows.
CREATE POLICY customer_audit_self_read ON public."AuditLog"
FOR SELECT TO pluto_app
USING (
  "userId" = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public."User" u
    WHERE u.id = (SELECT auth.uid()) AND u.status = 'active'
  )
);
