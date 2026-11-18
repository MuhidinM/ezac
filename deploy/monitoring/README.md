# Monitoring (Grafana Cloud)

Dashboard: https://fondcrab2567.grafana.net/d/ezac-overview · Alerts: Alerting → Alert rules → folder `ezac`.

Dashboards and alerts live in Grafana Cloud (free tier). The server sends **metrics only**; logs stay on the server
because they hold phone numbers and IPs.

| What | How | Alerts |
|---|---|---|
| Site up, from the internet | Grafana Synthetic Monitoring checks `https://ezaac.com/en` and `/bff/health?deep=1` from several countries | Site down from outside |
| Site, both web colours, gateway, backend ports | Alloy probes on the server (`config.alloy` → blackbox) | `SiteDown`, `WebLiveCopyDown`, `WebStandbyDown`, `GatewayDown`, `BackendServiceDown` |
| Errors and speed | nginx access log turned into counters on the server (lines are not shipped) | `High5xxRate`, `SlowPages` |
| Server | CPU, memory, disk, systemd units, reboots | `DiskFillingUp`, `DiskWillFillIn24h`, `MemoryLow`, `CPUSaturated`, `SystemdUnitFailed`, `ServerMetricsMissing` |
| Backups | `ezac-metrics.sh` reads the backup state | `BackupMissed`, `BackupJobFailed`, `RestoreTestOverdue`, `BackupShrank` |
| Deploys and pm2 | live colour, release, failed deploys, restarts | `DeployFailed`, `WebAppRestarting` |
| Certificate | expiry from the site probe | `TLSCertificateExpiresSoon` |

Backend services are **observed only** (health GET or TCP connect); nothing here changes them.

## Files

- `config.alloy` → `/etc/alloy/config.alloy`
- `ezac-metrics.sh` → `/usr/local/sbin/ezac-metrics.sh` (root, every minute via `ezac-metrics.timer`)
- `ezac-metrics.service`, `ezac-metrics.timer` → `/etc/systemd/system/`
- `alerts.yaml`: alert rules (Prometheus format), loaded as Grafana-managed rules
- `dashboard.json`: the EZAC overview dashboard (import in Grafana → Dashboards → New → Import)

Credentials go only in `/etc/default/alloy` (`root:alloy`, mode 640), never in the repository:

```
CONFIG_FILE="/etc/alloy/config.alloy"
CUSTOM_ARGS="--server.http.listen-addr=127.0.0.1:12345 --disable-reporting"
GCLOUD_PROM_URL="https://prometheus-prod-XX-....grafana.net/api/prom/push"
GCLOUD_PROM_USER="<Prometheus instance ID>"
GCLOUD_TOKEN="<access policy token: metrics:write>"
```

## Setting up Grafana Cloud (once)

1. Sign up at grafana.com and create a stack (region: the closest EU one).
2. **Access policy token** (grafana.com/orgs/<org>/access-policies): scope `metrics:write` (Alloy).
3. Stack → Prometheus → Details: copy the remote-write URL and the instance ID (username).
4. Alerts → Contact points: email to the on-call person and a Telegram bot (BotFather token + group chat ID).
   Notification policy: `severity=critical` repeat every 1h; `severity=warning` repeat every 12h.
5. Testing & synthetics → Synthetics → add HTTP checks for `https://ezaac.com/en` and
   `https://ezaac.com/bff/health?deep=1`, every 1 minute, from 3+ probe locations, alert on failure.

## Loading the alert rules

The rules run as **Grafana-managed** alerts (folder `ezac`), so they use Grafana's contact points and the
notification policy (Telegram `ezac-telegram`; critical repeats every 1h, warning every 12h). Load or update them
with Grafana's Prometheus-conversion API and a service account token (role Admin), one group at a time:

```bash
python - <<'PY'
import yaml, urllib.request
TOKEN = "glsa_..."   # Administration → Service accounts
d = yaml.safe_load(open("deploy/monitoring/alerts.yaml"))
for g in d["groups"]:
    req = urllib.request.Request(
        "https://fondcrab2567.grafana.net/api/convert/prometheus/config/v1/rules/ezac",
        data=yaml.safe_dump(g, sort_keys=False).encode(), method="POST",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/yaml",
                 "X-Grafana-Alerting-Datasource-UID": "grafanacloud-prom", "X-Disable-Provenance": "true"})
    print(g["name"], urllib.request.urlopen(req).status)
PY
```

Every selector carries `asserts_env=""`: Grafana Cloud's Knowledge graph app stores a copy of each series with an
`asserts_env` label, which would otherwise double values and fire each alert twice.

## Checking on the server

```bash
systemctl status alloy ezac-metrics.timer
cat /var/lib/ezac-metrics/ezac.prom
curl -s 127.0.0.1:12345/-/ready
```

The Alloy UI (component health, live values) is on `127.0.0.1:12345`; open it through an SSH tunnel:
`ssh -L 12345:127.0.0.1:12345 ezac-infra`, then http://localhost:12345.
