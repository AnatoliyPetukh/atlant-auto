# Project Structure

## Current folders

- `atlant-auto-draft/` - main Atlant Auto website draft.
- `atlant-auto-draft/assets/cars/` - public vehicle photos used by the site.
- `api/` - small server-side helpers for Auction Post.
- `_publish-homepl/` - generated deployment folder, not stored in Git.
- `_drive_latest_cars/` - temporary imported photos, not stored in Git.

## Current root files

- `publish-homepl.ps1` - publishes prepared files to home.pl.
- `serve.ps1` and `Запустить приложение.cmd` - local preview helpers.
- `README.md` - project overview.
- `CHANGELOG.md` - version history.
- `SECURITY.md` - access and secret rules.

## Direction

The project should stay simple:

- no multi-user editor;
- no CMS unless it becomes necessary;
- vehicle catalog updates can be made through code with PDF/photo inputs;
- GitHub is the protected source of truth;
- home.pl is deployment, not the source of truth.
