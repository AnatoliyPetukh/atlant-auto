# Security

This is a private project owned by Atlant Auto.

## Access

- Keep the GitHub repository private.
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
- Disable GitHub Actions unless automation is intentionally added.

## If access must be revoked

1. Remove the collaborator from repository settings.
2. Rotate hosting/FTP passwords if that person ever had deployment access.
3. Revoke any personal access tokens or deploy keys created for that person.
4. Check recent commits and repository access logs in GitHub.
