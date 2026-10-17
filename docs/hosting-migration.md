# Hosting migration and recovery

Status: 2026-10-17, migration in progress. Do not disable GitHub Pages or make the repository private until home.pl serves the public domain with verified HTTPS.

## Prepared

- Exact published artifact from commit `8789bb63833c503b7c5fba5e50f9fe193e0222c6`, Actions run `39052025092`, copied to home.pl `public_html/website`.
- Password-protected, noindex preview at `https://serwer2454127.home.pl/site-preview/pl/`.
- Existing `internal-api`, `drafts`, `offers`, and private vehicle data remain separate from the static site.
- Public site rollback archive and consistent application backups are outside public access. Local copies are excluded from Git.
- GitHub secret scanning and push protection enabled; scan reported no current open alerts at the check time.

## Certificate / DNS

The paid homeSSL subscription covers `atlantauto.pl` and `www.atlantauto.pl` until 2027-10-03. Certificate activation is pending. Order details report completed domain verification but a CAA error for www. Its CNAME to GitHub inherits GitHub CAA, which does not authorize Certum (home.pl documentation confirms this behavior).

Changed only www CNAME from `anatoliypetukh.github.io.` to `atlantauto.pl.` (panel TTL 300). This keeps www on the same existing GitHub apex addresses while removing the inherited restriction after DNS propagation. Confirm authoritative answers and certificate issue/install before switching the apex.

Baseline apex A: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Target home.pl address observed: `46.242.238.158`. Preserve MX `10 serwer2454127.home.pl.`, SPF, DKIM, and other DNS records. Do not assume panel domain-assignment settings match manually edited DNS records.

Use strict TLS with curl --resolve to test home.pl before changing public routing; never bypass validation. Assign domain web root to the prepared website directory, not the legacy root. Account for provider directory separation and inherited access controls when testing.

## Daily private data backup

Install `tools/homepl-backup-job.php` as `public_html/.atlant-internal/backup-job.php`, permissions 0600; its directory is denied over HTTP. Install `tools/homepl-cron-daily.php` as `public_html/cron-daily.php`, permissions 0600. The provider's native filename scheduler runs this through CLI. HTTP execution is denied.

The job creates a consistent SQLite backup and verifies every referenced asset against SHA-256 and size, deduplicates immutable objects by digest, keeps 14 successful snapshots, and uses a lock. One successful snapshot per Warsaw calendar day; `--force` allows a deliberate extra snapshot. Monitor `backups/last-success.json` and `last-error.json` privately via SSH. A first manual snapshot and repeat-day no-op passed; the first scheduled execution has not yet been observed.

An off-server encrypted copy was stored on the owner's computer and restored in a temporary directory for verification: SQLite integrity passed, all 159 assets matched. Encryption is AES-256-GCM. The encryption key is separate, private, and excluded from Git. Keep a recoverable copy of that key in the owner's password manager. There is not yet an automated independent cloud backup; local/off-server export must be repeated until that is configured. Database/photos backups do not replace periodic backup of private app configuration and access recovery material.

## Remaining gates

1. Verify DNS propagation, certificate issue and installation, and home.pl domain mapping without visitor downtime.
2. Verify public pages/assets/catalog and preserved email records after cutover.
3. Retire GitHub Pages, adapt CI to hosting-independent artifacts, then make repository private.
4. Audit hosting users/FTP and 2FA; do not revoke unknown accounts without identifying their use.
5. Observe the first native daily job and configure automatic independent off-site backups and failure notifications.
