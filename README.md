# Atlant Auto

Private source repository for the Atlant Auto website and related internal tools.

## What is inside

- `atlant-auto-draft/` - the current website draft outside Tilda.
- `atlant-auto-draft/assets/cars/` - public vehicle photos used by the website.
- `api/` - helper endpoint for Auction Post parsing.
- `publish-homepl.ps1` - deployment script for home.pl, without stored passwords.
- `docs/` - project structure and Git workflow notes.

## Moving to another computer

Follow [`docs/NEW-COMPUTER-SETUP.md`](docs/NEW-COMPUTER-SETUP.md). It covers
the repository and the local-only files that must be copied separately if they
are still needed.

## Local preview

Run `serve.ps1` to preview the local tools.

The Atlant Auto draft can also be opened from:

```text
atlant-auto-draft/index.html
```

## Temporary KYC publication profile

The public build currently includes only Polish and English pages. The root URL
redirects to Polish, and customs-calculator pages are excluded. Run
`npm run generate:seo` before publishing; the build also removes obsolete
Russian and calculator routes from the public folder.

## Publishing

Publishing to home.pl is handled by:

```powershell
.\publish-homepl.ps1
```

The script asks for FTP credentials at runtime or reads them from temporary environment variables. Do not store FTP passwords in this repository.

## Vehicle updates

For future catalog updates, keep the input simple:

1. Create one folder per vehicle.
2. Add inspection PDF files.
3. Add vehicle photos.
4. Mark the preferred front cover photo if it is not obvious.
5. Add price/comment if known.

Codex can then extract the data, update the catalog, and prepare the site for publishing.

## Security

This repository must remain private. See `SECURITY.md` before adding collaborators, deploy keys, tokens, PDFs, or hosting credentials.
