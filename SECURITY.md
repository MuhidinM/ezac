# Security policy

This repository is the website of the Ethiopian Zakat & Awqaf Commission and its staff portal. It handles staff
sign-in, household records, bank details and payouts, so please report problems privately.

## Reporting a vulnerability

> **TODO (Commission):** name the security contact and a private channel (an email address or form the Commission
> controls), and the response times you commit to.

- **Contact:** TODO
- **Do not** open a public issue, pull request or discussion for a security problem.
- Include: the address or screen, what you did, what happened, and what an attacker could gain. Screenshots or a
  request/response help. Leave out real household or payment data; describe it instead.
- Please give us time to fix the problem before you tell anyone else.

## Scope

In scope: the public site, the staff portal (`/dashboard`, `/login`) and this app's API under `/bff`.

The gateway, Keycloak and the services behind them are run by the backend team. Report problems there to the same
contact; we pass them on.

Out of scope: attacks that need a compromised staff device or account, denial of service by volume, and findings from
automated scanners without a demonstrated impact.

## Supported versions

Only what is deployed from `master`. There are no older releases to patch.

## How the app protects itself

For reviewers. Details are in README.md, "Architecture".

- **Sessions:** the gateway's tokens are kept in httpOnly, SameSite=Lax cookies (Secure in production). The browser
  never sees them and never calls the gateway directly.
- **Access:** every `/bff` route checks the session and role before calling the gateway, which checks them again.
  Routes that call a public gateway endpoint on behalf of staff first confirm the token with the gateway.
- **Cross-site requests:** `/bff` writes from another origin are refused (`proxy.ts`).
- **Sign-in:** failed attempts are limited per account and IP; a temporary password must be changed before the
  portal opens.
- **Uploads and files:** request bodies are size-capped; served files that could run script are forced to download.
- **Headers:** a Content Security Policy (still partly report-only), frame blocking, HSTS and a Permissions-Policy
  (`next.config.ts`).
- **Logs:** no bodies, cookies, tokens or query strings; browser error reports are scrubbed of personal data before
  they are logged.
- **Dependencies:** pnpm with a frozen lockfile; install scripts run only for the packages allowed in
  `pnpm-workspace.yaml`; CI fails on high-severity advisories in production dependencies; Dependabot opens update
  pull requests weekly.
