# Export, encrypted backup and recovery

Settings → Data controls provides an authenticated private JSON export, recovery instructions and explicit application deletion. Exports contain sensitive owner records; store them privately. The export is bounded to 5,000 rows per table and 16 MiB and fails rather than silently omitting excess data. Credentials, connector tokens/cursors, pairing codes and worker leases are excluded. Supabase Auth identities and `.env` are outside application snapshots.

Encrypted CLI backups use AES-256-GCM with a fresh nonce, authenticated versioned envelope and the owner's separately stored `JARVIS_BACKUP_KEY` (64 hexadecimal characters). The key is not generated or held on the owner's behalf. With configuration saved locally:

```
pnpm backup create <chosen-path>.jarvis-backup
pnpm backup verify <chosen-path>.jarvis-backup
```

Creation refuses to overwrite an existing file. Verification authenticates the ciphertext and validates format/ownership without changing the database. Copy backups off the development machine according to your own retention policy. Losing the key makes recovery impossible. Filesystem permissions should restrict backup access; Windows ACLs must be managed by the owner.

## Restore replaces application data

First make a current backup, stop the application and all workers, and set `TELEGRAM_ENABLED=false` and `JARVIS_NOTIFICATIONS_ENABLED=false`. Ensure the matching Supabase Auth user still exists and the configured owner UUID matches the backup. Restore uses administrative `DIRECT_URL`, so keep that credential private. Only after reviewing the target and replacement scope, run:

```
pnpm backup restore <chosen-path>.jarvis-backup --replace --owner=<configured-owner-UUID>
```

All 39 application tables are validated and replaced in one transaction, with parent-safe insertion and rollback on failure. Restore disconnects providers, clears pairing, cancels old notification/reply work and advances notification rule versions. Credentials are not restored. Reconnect and pair explicitly after reviewing restored data, then restart only desired workers. Auth identities/passwords, environmental secrets and external accounts need their own recovery procedures.

Synthetic tests verified encrypted round trips, wrong keys/tampering, ownership rejection, transactional restore and deletion cascades. No real owner export, backup, restore or deletion was performed. A real recovery rehearsal and off-device key/backup custody remain owner acceptance steps. There is no automatic backup scheduler enabled.

Deletion requires the exact phrase shown in the UI, freshly verified owner access and same-origin submission. It deletes the application user and cascading app data, then signs out locally. It does not remove the Supabase Auth identity, provider accounts, external copies or backups. Export or back up first if those records are needed.

## Chase bank transaction history (2026-10-17)

Read-only Chase/Plaid Transactions connection, encrypted owner-bound grant and OAuth session, periodic hosted-worker sync, atomic cursor reconciliation, pending-to-posted replacement, and paginated Finances bank history are implemented. Production is disabled without explicit free Trial confirmation and owner credentials/consent. No live bank connection has been tested. Existing manual ledger and alerts do not automatically include bank records. Additive bank-history migration extends existing provider/kind constraints and indexes; no new database role or paid worker is required. Revoke the bank Item before app-data deletion or snapshot replacement; backups exclude credentials and restores disconnect providers. See [CHASE_BANK_SETUP.md](CHASE_BANK_SETUP.md) for activation, free Trial limits and recovery details.
