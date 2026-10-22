# Pluto onboarding fix — permission policy awaiting approval

Project: qnfyrnbrrehgdqursitg. Existing 27 migrations are applied. Proposed migration 28 is prepared locally only.

## Observed error

The local server returned PostgreSQL 42501 at prisma.auditLog.create() while completing onboarding: new row violates row-level security policy for AuditLog. The enclosing onboarding transaction rolls back, so creating the Auth account did not create a completed application profile.

## Cause and fix

pluto_app already has SELECT/INSERT privileges on AuditLog. Its INSERT policies allow a customer.onboarding success event, but the historical SELECT policy applies to authenticated, not pluto_app. Prisma's create requests the inserted row with RETURNING; PostgreSQL requires a matching SELECT policy as well. The missing policy rejects that return. It also prevents audit-based per-user rate checks from seeing their own audit history.

Prepared migration: 20261022090000_pluto_audit_self_read.

It adds one SELECT policy for pluto_app requiring both:
- AuditLog.userId equals the verified request's auth.uid().
- The matching customer profile is active.

No data, password, table grants, provider configuration or existing migration files change. Browser roles retain no table access. No UPDATE/DELETE access is added. Other customers' records and inactive customers' records remain hidden.

## Verification

A local PostgreSQL regression reproduces the original INSERT RETURNING denial with the first 27 migrations, then installs only this policy and verifies success. Separate customer identities cannot read or insert another customer's events; suspended customers cannot read or insert events; audit UPDATE/DELETE and browser reads stay denied. Setup and privilege tests also pass. Full suite results are recorded in PLUTO_TEST_RESULTS.md.

## Next action

Approve this one policy migration on qnfyrnbrrehgdqursitg. It is not yet executed because the owner's cloud/database changes require explicit approval. After applying it, retry the local onboarding form. No personal JARVIS change or commercial deployment is included.