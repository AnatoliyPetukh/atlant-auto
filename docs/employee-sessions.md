# Personal ERP accounts

ERP sign-in establishes identity and role in one step. The private `.atlant-internal/erp-viewer-auth.json` configuration contains a `users` map keyed by login, with bcrypt `password_hash`, `role` (`owner`, `publisher`, `staff`) and boolean `enabled`. Local plaintext access files stay ignored and mode 0600. There is no presentation-password fallback.

Owners and publishers can publish, unpublish and synchronise already-published cars. Staff can work on internal records. Actions retain the personal login in revision/event history; a publisher is not renamed owner. Source extension endpoints still require their existing Bearer employee keys, independently of ERP sign-in.

The Secure/HttpOnly/SameSite=Lax cookie remains scoped to `/drafts/`. Sign-in rotates the session ID. Server-side sessions expire after 30 minutes idle or eight hours absolute. Every request rechecks the account and a fingerprint including password hash, username, role and enabled state; removal, disabling, password rotation or role changes invalidate existing sessions. Missing or malformed configuration fails closed. All mutations require CSRF. Failed logins retain the existing rate limit.

ERP forms no longer ask for an employee key. A legacy posted key cannot change the authenticated personal identity or grant extra permissions. To switch users, log out and sign in again. The historical employee-binding helper remains for compatibility tests, but personal ERP authentication no longer relies on it.

Validation: `tools/erp-accounts.test.php` covers authentication, malformed inputs, personal identity, role permissions, disabled users, expiry and revocation. `tools/product-store.test.php` covers a publisher publishing and synchronising isolated test vehicles while retaining their own actor name. Live checks use separate HTTP sessions, do not modify production cars and send no Telegram messages.
