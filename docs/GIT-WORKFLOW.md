# Git Workflow

This project is maintained by one owner, so the workflow stays simple.

## Branches

- `main` is the stable version.
- Work directly in `main` for small content edits.
- Use a temporary branch only for larger redesigns or risky changes.

## Commit style

Use short messages in this style:

- `site: update vehicle catalog`
- `site: adjust calculator copy`
- `assets: add Peugeot 5008 photos`
- `deploy: update home.pl publishing script`

## Version tags

Use tags for meaningful public versions:

- `v0.1.0` first private draft;
- `v0.2.0` catalog and calculator usable;
- `v1.0.0` production-ready public site.

## Before each commit

1. Make sure no passwords or private PDFs are included.
2. Check the site locally.
3. Record notable changes in `CHANGELOG.md`.
4. Commit only source files and intentional assets.

## What belongs in Git

- Site source: HTML, CSS, JS.
- Vehicle photos that are intended for the public site.
- Publishing scripts without passwords.
- Documentation.

## What does not belong in Git

- `node_modules`.
- `_publish-homepl`.
- `_drive_latest_cars`.
- PDFs, invoices, private inspection archives.
- Local app state such as `.codex` and `.agents`.
