# Security

This project is owned by Atlant Auto. The repository is currently public. On 2026-10-17 the owner explicitly authorized publishing the reviewed version 0.7.0 source code; credentials and vehicle/customer records remain excluded.

## Access

- Treat all committed source as publicly readable while the repository is public.
- Prefer a private repository for internal code after verifying GitHub Pages plan compatibility or moving website hosting.
- Do not add collaborators unless they are required for a specific task.
- Remove collaborator access immediately after the task is finished.
- Use personal GitHub accounts only; do not share one account between people.

## Secrets

Never commit:

- FTP logins or passwords;
- hosting control panel passwords;
- `.env` files;
- customer documents, PDFs, invoices, or private vehicle documents;
- temporary exports from Google Drive or hosting panels.

The publishing script reads FTP credentials from environment variables or asks for them at runtime. Passwords must not be stored in the repository.

## Recommended GitHub settings

- Private repository.
- Two-factor authentication enabled on the owner account.
- Branch protection on `main`.
- Require pull request before merge if outside collaborators are ever invited.
- Keep the intentional GitHub Pages build/test/deployment workflow; review any additional workflow before enabling it.
- Keep home.pl SSH credentials out of GitHub while server deployment is performed from the authorized local workstation.
- Enable secret scanning and push protection where available.
- Back up the production database and immutable assets independently of Git; periodically test restore.

## If access must be revoked

1. Remove the collaborator from repository settings.
2. Rotate hosting/FTP passwords if that person ever had deployment access.
3. Revoke any personal access tokens or deploy keys created for that person.
4. Check recent commits and repository access logs in GitHub.
