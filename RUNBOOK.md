# EZAC web app: runbook

What to do when the site is down, slow or wrong, and how to deploy and roll back. For setup, environment variables,
the nginx settings and the architecture, see [README.md](README.md).

The web app holds no data of its own: households, payments, payouts and accounts live behind the gateway. When the
web app is healthy but a screen fails, the cause is usually the gateway, Keycloak or a service behind them.

## Who to call

> **TODO (Commission):** fill in names and how to reach them. The backend's answer to "Backups, restore test and
> on-call" (section 10 of the backend go-live requests) covers the gateway side.

| Area | What it covers | Owner | How to reach them (hours, out of hours) |
| --- | --- | --- | --- |
| Web app (this repo) | Public site, staff portal, `/bff`, deploys | TODO | TODO |
| Web server | The Linux host, nginx, TLS certificate, pm2, `deploy.sh` | TODO | TODO |
| Gateway and backend services | `API_BASE_URL`, beneficiary, back-office, zakat and payment services | TODO | TODO |
| Sign-in (Keycloak, auth service) | Staff accounts, roles, password resets, lockouts | TODO | TODO |
| Bank connection (Coop Bank, EthQR) | Payouts, zakat payments, settlement questions | TODO | TODO |
| DNS and domain | The site's address and records | TODO | TODO |
| Security incidents | See [SECURITY.md](SECURITY.md) | TODO | TODO |

Escalate in this order unless the problem is clearly elsewhere: web app owner, then the area that the logs point to
(see "Reading the logs").

## Is it up?

```bash
# The app process answers (no gateway call). 200 {"status":"ok","release":"<commit>","uptimeSeconds":…}
curl -s https://<site>/bff/health

# Also checks the gateway answers. 503 {"status":"degraded","gateway":"unreachable"} when it doesn't.
curl -s https://<site>/bff/health?deep=1
```

`release` is the deployed commit (`GIT_SHA`). If it isn't the commit you expect, the deploy didn't restart the app or
`deploy.sh` didn't export `GIT_SHA`.

On the server:

```bash
pm2 status ezac          # online, restarts, memory
pm2 logs ezac --lines 200
```

## Deploying

A push to `master` deploys once the **verify** job (lint, type-check, tests, build, audit) passes. See README.md,
"Deploying", for the secrets and what `deploy.sh` must do. After a deploy:

1. Watch the workflow's "Check the site is up" step (runs when the repository variable `SITE_URL` is set).
2. Open the public home page and `/login`, sign in, and open the dashboard.
3. `pm2 logs ezac` for a minute: no `startup_config` or a burst of `request_error` lines.

`deploy.sh` lives only on the server (`/var/www/ezac/deploy.sh`). **TODO (Commission):** keep a copy in this repo or
in the server's configuration management so it can be rebuilt.

## Rolling back

1. Preferred: revert the bad commit on `master` and push. Verify and deploy run as usual.
2. Faster: in GitHub Actions, open the last good run of "CI and deploy" and choose **Re-run jobs**. It deploys that
   run's commit again (this needs `deploy.sh` to check out `$GIT_SHA`).
3. By hand, on the server: check out the last good commit, `pnpm install --frozen-lockfile`, `pnpm build`, then
   `GIT_SHA=<commit> pm2 startOrRestart ecosystem.config.cjs --update-env`.

Then check `/bff/health` reports the old commit as `release`.

A rollback of the web app does not undo anything done through it (payouts, payments, registrations): those live in the
backend.

## Reading the logs

pm2 keeps the app's output in `~/.pm2/logs/ezac-out.log` (info) and `~/.pm2/logs/ezac-error.log` (warnings and
errors). Every line the app writes is one JSON object, after the timestamp pm2 adds:

```text
2026-11-06 09:14:02 +03:00: {"level":"error","event":"gateway_timeout","time":"…","release":"…","requestId":"…","label":"backoffice","method":"GET","path":"/api/…"}
```

To filter with `jq`, drop the timestamp first:

```bash
sed 's/^[^{]*//' ~/.pm2/logs/ezac-error.log | jq -c 'select(.event == "gateway_unreachable")'
```

**A user quotes "Reference: …"**: search for it. It is either a `requestId` (a failed call to the gateway; the same id
went to the gateway as `X-Request-Id`) or a `digest` (a page that failed on the server).

```bash
grep -h '<reference>' ~/.pm2/logs/ezac-*.log
```

Nothing personal is logged on purpose: no request or response bodies, cookies, tokens or query strings. The
exceptions are sign-in events, which keep the account name (and the IP for refused sign-ins) for security reviews.

### Events

| Event | Level | Means | First thing to check |
| --- | --- | --- | --- |
| `startup_config` | fatal | `API_BASE_URL` is missing or not a URL; every gateway call fails | The environment (README, "Environment variables"), then restart |
| `config` | warn | `API_BASE_URL` falls back to localhost, or uses plain `http://` | Same |
| `gateway_unreachable` | error | No connection to the gateway; `code` and `hint` say why (refused, DNS, timeout, certificate) | `API_BASE_URL`, `NODE_EXTRA_CA_CERTS`, the gateway's status |
| `gateway_timeout` | error | The gateway took longer than 30 s (60 s for files, up to 90 s for payouts) | The gateway or the service named by `path` |
| `gateway_error` | error | The gateway answered 5xx or something unreadable; `message` is its text | The service named by `path`; quote `requestId` / `upstreamRequestId` to the backend |
| `auth_unavailable` | error | A token expired and Keycloak could not renew it; users see "try again" and stay signed in | Keycloak and the auth service |
| `bff_unexpected_error` | error | A bug in a `/bff` route; `stack` says where | The web app owner |
| `request_error` | error | A page or route failed on the server; `digest` is the user's reference | The web app owner |
| `client_error` | error | A browser hit an error (`source`: `error`, `unhandledrejection`, `boundary`); `browser` is the family only | The web app owner, if it repeats |
| `login_refused` | warn | Wrong password, disabled or unknown account (`reason` from the gateway) | Many for one `account` or `ip`: a guessing attempt |
| `login_no_role` | warn | Signed in but has no ADMIN, BRANCH or FIELD_OFFICER role | Keycloak role mapping for that account |
| `login_failed`, `login_unreadable` | error | The sign-in service failed or answered without tokens | Keycloak and the auth service |
| `origin_refused`, `origin_unverifiable` | warn | A save from another origin was blocked, or can't be checked | `SITE_URL` and the nginx `Host` header (README, "Reverse proxy") |
| `csp_violation` | warn | The browser blocked or would block a resource | Expected now and then; a new `blocked` host after a deploy needs a look |
| `logout_cookie_clear_failed` | error | Sign-out fell back to expiring the cookies on the response | Nothing, unless it repeats |

Browser reports are capped at 10 per browser and 120 in total per minute, so a loop can't fill the disk.

## Common problems

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| Every staff screen says "The service is not responding" | Gateway down or unreachable (`gateway_unreachable`) | `curl /bff/health?deep=1`; check the gateway; on certificate errors check `NODE_EXTRA_CA_CERTS` |
| Staff are asked to sign in again and again | Keycloak refusing refresh tokens, or clocks out of sync | Keycloak status; server time (`timedatectl`) |
| "Too many sign-in attempts" for a real user | 5 failures per account and IP, or 30 per IP, in 15 minutes | Wait 15 minutes. The count is in the app's memory: a restart clears it, so don't restart just for this |
| Saving anything gives "This request came from another website" | `origin_refused`: `SITE_URL` doesn't match the address users open, or nginx rewrites `Host` | Set `SITE_URL` exactly (scheme, host, port) or `proxy_set_header Host $http_host;` |
| Public figures are old or missing | The public pages refresh every few minutes from the gateway's public endpoints | `gateway_*` lines for those endpoints |
| The app restarts by itself | pm2's 1 GB memory limit (`max_memory_restart`) | `pm2 status ezac` restarts count; report to the web app owner with the time |

## Known gaps

- No uptime monitor or alerting is configured in this repo. **TODO (Commission):** point a monitor at
  `/bff/health?deep=1` and alert the web app owner, and decide who watches `error`-level log lines.
- Log retention: install `pm2-logrotate` once on the server (README) and **TODO (Commission):** set how long logs are
  kept.
- The design documents (SRS, SDD, TDD) and the backend request notes are kept outside git on purpose: they hold
  internal backend details. Keep them in a shared, access-controlled place with version history.
