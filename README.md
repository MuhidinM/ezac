# EZAC web app

The website of the Ethiopian Zakat & Awqaf Commission, and the staff portal behind it.

- **Public site** (`/`, `/about`, `/zakat/*`, `/waqf/*`, `/transparency/*`, …): explains zakat and waqf, the zakat
  calculator, causes and impact stories, and live figures from the Commission's gateway.
- **Staff portal** (`/dashboard/*`, sign-in at `/login`): beneficiary registration and assessments, the payout pool,
  payouts, branches, field officers and zakat administration. Access depends on the account's role (ADMIN,
  BRANCH or FIELD_OFFICER).

It is a Next.js 16 App Router app (React 19, TypeScript, Tailwind CSS v4, shadcn/Radix components).

## Prerequisites

- Node.js 22
- pnpm 12.4.1 (the version that wrote `pnpm-lock.yaml`): `corepack enable && corepack prepare pnpm@12.4.1 --activate`
- Network access to a gateway, and for the UAT gateway its certificate (`certs/uat-ezac.pem`, not in git: ask a
  teammate)

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev                     # local gateway, or:
pnpm dev:uat                 # UAT gateway, trusting certs/uat-ezac.pem
```

Open http://localhost:3000.

## Environment variables

Next.js reads `.env.local` in development and `.env.production` for `next build` and `next start`. A value already
set in the process environment wins over the files. See `.env.example` for a template.

| Variable | Needed | When it is read | What it does |
| --- | --- | --- | --- |
| `API_BASE_URL` | **Required** in production | Server, at runtime | The gateway's address, e.g. `https://gateway.example`. With no value the app logs a startup error and every gateway call fails. The build does not need it. |
| `NODE_EXTRA_CA_CERTS` | While the gateway uses the UAT self-signed certificate | Node, at process start only | Path to that certificate, e.g. `/var/www/ezac/certs/uat-ezac.pem`. Node reads it before Next loads `.env` files, so on the server `ecosystem.config.cjs` passes it on from the deploy shell or `.env.production`. Remove it once the gateway has a certificate from a public CA. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional | Build (copied into the browser code) | Google Maps key for the impact map on the home page. Without it the map shows a placeholder. Restrict the key to the site's domain in Google Cloud. |
| `SITE_URL` | Recommended in production | Build and runtime | The exact public origin users open (scheme, host and port), e.g. `https://ezac.gov.et`. Used for absolute URLs in page metadata, `robots.txt`, `sitemap.xml` and `llms.txt` (without it they use `https://ezaac.com`), and by the cross-site check on `/bff` writes: when nginx rewrites `Host`, this is the only origin allowed to save, so `www`, IP and `http://` addresses must redirect to it. Set it before the build: static pages read it then. |
| `GIT_SHA` | Optional | Runtime | Release id shown in error and CSP log lines. The deploy workflow passes the commit to `deploy.sh`; pm2 falls back to the checked-out commit. |
| `ALLOW_INSECURE_AUTH_COOKIES` | Only for a plain-HTTP test host | Runtime | `true` lets sign-in cookies work without HTTPS. Never set it in production. |
| `TRUST_ROLELESS_ACCOUNTS` | Only if the gateway issues accounts without roles | Runtime | `true` gives accounts with no ADMIN, BRANCH or FIELD_OFFICER role the old default access. Without it they get no portal access. |

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Development server on port 3000. |
| `pnpm dev:uat` | Same, trusting the UAT gateway certificate in `certs/uat-ezac.pem`. |
| `pnpm build` | Production build. Works without a gateway. |
| `pnpm start` | Serves the production build. |
| `pnpm start:uat` | Same, trusting the UAT gateway certificate. |
| `pnpm lint` | ESLint. CI fails on any error. |
| `pnpm typecheck` | `tsc --noEmit`. On a fresh checkout run `pnpm exec next typegen` first (it writes `next-env.d.ts`). |
| `pnpm test` | Unit tests (Vitest, in Node): `tests/<area>/*.test.ts`, mirroring `lib/<area>`. `pnpm test tests/api/body.test.ts` runs one file; `pnpm exec vitest` watches. CI fails on any failure. |

## Architecture

- **Public pages** are server-rendered and mostly static, refreshed every few minutes from the gateway's public
  endpoints.
- **Staff portal** pages run in the browser and talk only to this app's own API under **`/bff/*`** (backend for
  frontend). The `/bff` route handlers add the user's token and call the gateway. The browser never calls the gateway
  directly.
- **Sessions** live in httpOnly, SameSite=Lax cookies (Secure in production) holding the gateway's access and refresh
  tokens. `proxy.ts` sends signed-out visitors from `/dashboard` to `/login`; the staff `/bff` routes check the
  session and role again, and the gateway has the final say.
- **Security headers** (CSP, frame blocking, HSTS, Permissions-Policy) are set in `next.config.ts`. The full Content
  Security Policy runs in report-only mode; reports arrive at `/bff/csp-report` and are logged.
- **Logs**: `instrumentation.ts` writes one JSON line per server error (route, release, error digest; no headers,
  cookies or query strings) and a loud line at startup if `API_BASE_URL` is missing or invalid.

## SEO and languages

- **Languages**: the public site is in English (default, plain URLs like `/about`), Amharic (`/am/...`), Afaan
  Oromoo (`/om/...`) and Arabic (`/ar/...`, right to left). Pages live in `app/[lang]/`; `proxy.ts` serves plain
  URLs from `/en` and redirects `/en/...` to the plain URL. Strings are in `lib/i18n/dictionaries/<lang>/`, with
  English as the source the others are typed against. The staff portal is English only.
- **Page metadata**: each page calls `pageMetadata()` (`lib/seo.ts`) for its title, description, canonical URL,
  `hreflang` alternates, Open Graph and Twitter card. The default social image is `public/og/ezac-og.png`
  (1200x630). JSON-LD helpers are in `lib/structured-data.ts`.
- **Crawler files**: `app/robots.ts` (`/robots.txt`: everything open except `/dashboard`, `/login` and `/bff`),
  `app/sitemap.ts` (`/sitemap.xml`: every public page in all four languages with `hreflang` alternates, plus the
  published causes and impact stories, refreshed every 5 minutes) and `app/llms.txt/route.ts` (`/llms.txt`: a
  plain summary of the site for AI assistants). **When you add a public page, add its path to `PUBLIC_PATHS` in
  `app/sitemap.ts`**, and to `app/llms.txt/route.ts` if it is a main section.
- **Icons**: `app/favicon.ico`, `app/icon.svg` (a copy of `public/logo.svg`), `app/apple-icon.png` (180x180) and
  `app/manifest.ts` (`/manifest.webmanifest`). Next adds the `<link>` tags.

## Health check

- `GET /bff/health`: 200 `{ status: "ok", release, uptimeSeconds }` while the app is up. `release` is `GIT_SHA`.
- `GET /bff/health?deep=1`: also checks that the gateway answers; 503 `{ status: "degraded" }` when it doesn't.

No sign-in, no personal data. The deploy workflow calls it after each deploy when the repository variable `SITE_URL`
is set, and warns if `release` isn't the commit it deployed. Uptime monitors can use it too.

## Deploying

1. Every pull request and push runs the **verify** job in `.github/workflows/deploy.yml`: install with the frozen
   lockfile, lint, type-check, build and `pnpm audit --prod --audit-level high`.
2. A push to `master` (or a manual run) that passes verify runs **deploy**: one at a time, it connects over SSH and
   runs `GIT_SHA=<commit> bash /var/www/ezac/deploy.sh` on the server. Secrets: `SSH_PRIVATE_KEY`,
   `SSH_KNOWN_HOSTS`, `SSH_HOST`, `SSH_PORT`, `SSH_USER`.
3. `deploy.sh` (on the server, not in this repo) must check out exactly `$GIT_SHA`, install, build, and restart pm2
   with `pm2 startOrRestart ecosystem.config.cjs --update-env`, exporting `GIT_SHA`.
4. `ecosystem.config.cjs` runs one `next start` process. It has no defaults for the gateway or certificate: set them
   in `/var/www/ezac/.env.production` or export them in `deploy.sh` (see the comment at the top of that file).
   **Once, when moving from the old config** (which hard-coded the UAT gateway IP and certificate): after setting
   them, run `pm2 delete ezac && pm2 start ecosystem.config.cjs && pm2 save`. `startOrRestart --update-env` never
   removes a variable, so the old values would otherwise stay.
5. If the repository variable `SITE_URL` is set, the workflow then checks `${SITE_URL}/bff/health`.

On the server, install log rotation once: `pm2 install pm2-logrotate`. Logs are under `~/.pm2/logs/`.

### Reverse proxy (nginx)

The app relies on these headers from the proxy in front of `next start`. Without them the login rate limit sees every
visitor as one address, and the cross-site check on `/bff` writes can't tell the site's own pages from others.

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host              $http_host;    # $host would drop the port
    proxy_set_header X-Real-IP         $remote_addr;  # overwrite, never append:
    proxy_set_header X-Forwarded-For   $remote_addr;  # the client controls what it sends
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 25m;                         # the /bff upload cap
    proxy_read_timeout 120s;                          # payout calls may wait up to 90 s on the bank
}
```

Redirect plain HTTP to HTTPS, and every other address of the site (`www`, the IP) to `SITE_URL`.

### Rolling back

- Preferred: revert the bad commit on `master` and push. Verify and deploy run as usual.
- Faster, once `deploy.sh` checks out `$GIT_SHA`: in GitHub Actions open the last good run of "CI and deploy" and
  choose **Re-run jobs**. It deploys that run's commit again.
- By hand: on the server, check out the last good commit, build, and `pm2 restart ezac`.
