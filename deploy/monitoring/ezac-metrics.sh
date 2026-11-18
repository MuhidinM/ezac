#!/usr/bin/env bash
# Writes EZAC facts that no exporter knows about as Prometheus metrics, for Grafana
# Alloy's textfile collector. Installed as /usr/local/sbin/ezac-metrics.sh, run every
# minute by ezac-metrics.timer as root (the backup state is root-only). Read-only:
# it never changes the apps, the backups or the deploy.
set -uo pipefail

OUT_DIR=/var/lib/ezac-metrics
OUT=$OUT_DIR/ezac.prom
BACKUP_STATE=/var/lib/ezac-backup
WEB=/var/www/ezac
PM2_HOME=/home/ezaacadmin/.pm2

mkdir -p "$OUT_DIR" && chmod 755 "$OUT_DIR" || exit 1
tmp=$(mktemp "$OUT_DIR/.ezac.prom.XXXXXX") || exit 1
trap 'rm -f "$tmp"' EXIT

# First bytes of a regular file (never a FIFO, device or symlink: some of these files
# are writable by the app user, and this runs as root).
read_small() { [ -f "$1" ] && [ ! -L "$1" ] && timeout 5 head -c "${2:-32}" -- "$1" 2>/dev/null; }
# Unix time stored in a state file; nothing when missing or garbled.
epoch_file() { local v; v=$(read_small "$1" | tr -dc 0-9); [ -n "$v" ] && echo "$v"; }
# HELP + TYPE header.
meta() { echo "# HELP $1 $3"; echo "# TYPE $1 $2"; }

{
  meta ezac_backup_last_success_timestamp_seconds gauge "When the nightly backup last finished OK."
  v=$(epoch_file "$BACKUP_STATE/last-success") && echo "ezac_backup_last_success_timestamp_seconds $v"

  meta ezac_backup_last_size_bytes gauge "Size of the last good backup set."
  s=$(read_small "$BACKUP_STATE/last-size" 20 | tr -d '[:space:]')
  [ -n "$s" ] && v=$(numfmt --from=iec "$s" 2>/dev/null) && echo "ezac_backup_last_size_bytes $v"

  meta ezac_backup_last_restore_test_timestamp_seconds gauge "When the weekly restore test last passed."
  v=$(epoch_file "$BACKUP_STATE/last-restore-test") && echo "ezac_backup_last_restore_test_timestamp_seconds $v"

  # Off-site copies start once an off-site target is configured (owner decision D2).
  meta ezac_backup_offsite_configured gauge "1 when an off-site backup target is configured."
  echo "ezac_backup_offsite_configured $([ -s /etc/ezac-backup/offsite.conf ] && grep -q '^OFFSITE_TARGET=..' /etc/ezac-backup/offsite.conf 2>/dev/null && echo 1 || echo 0)"
  meta ezac_backup_last_offsite_timestamp_seconds gauge "When a backup was last copied off the server."
  v=$(epoch_file "$BACKUP_STATE/last-offsite") && echo "ezac_backup_last_offsite_timestamp_seconds $v"

  meta ezac_systemd_unit_failed gauge "1 when the unit's last run failed."
  for unit in ezac-backup ezac-restore-test; do
    r=$(timeout 5 systemctl show "$unit.service" -p Result --value 2>/dev/null)
    echo "ezac_systemd_unit_failed{unit=\"$unit\"} $([ -n "$r" ] && [ "$r" != success ] && echo 1 || echo 0)"
  done

  meta ezac_web_active_color gauge "1 for the colour nginx sends traffic to."
  active=$(read_small "$WEB/state/active-color" 16 | tr -dc a-z)
  for c in blue green; do echo "ezac_web_active_color{color=\"$c\"} $([ "$c" = "${active:-blue}" ] && echo 1 || echo 0)"; done

  cur=$(readlink -f "$WEB/current" 2>/dev/null)
  if [ -n "$cur" ]; then
    meta ezac_web_release_info gauge "The live release (commit) of the web app."
    echo "ezac_web_release_info{release=\"$(basename "$cur" | tr -dc 0-9a-z | cut -c1-12)\"} 1"
    meta ezac_web_release_timestamp_seconds gauge "When the live release was switched in."
    echo "ezac_web_release_timestamp_seconds $(stat -c %Y "$WEB/current" 2>/dev/null || echo 0)"
  fi

  meta ezac_web_last_failed_deploy_timestamp_seconds gauge "When a deploy last failed its health check (0 = none kept)."
  t=$(find "$WEB/state" -maxdepth 1 -type f -name 'failed-*.log' -printf '%T@\n' 2>/dev/null | sort -n | tail -1 | cut -d. -f1)
  echo "ezac_web_last_failed_deploy_timestamp_seconds ${t:-0}"

  # pm2, only when its daemon already runs: "pm2 jlist" would otherwise start a new
  # daemon inside this short-lived unit, which systemd kills when the unit exits.
  pm2_up=0
  if [ -S "$PM2_HOME/rpc.sock" ] && pgrep -u ezaacadmin -f 'PM2 .*God Daemon' >/dev/null; then
    pm2json=$(timeout 10 runuser -u ezaacadmin -- env HOME=/home/ezaacadmin PM2_HOME="$PM2_HOME" pm2 jlist 2>/dev/null)
    if [ -n "$pm2json" ]; then
      printf '%s' "$pm2json" | timeout 10 node -e '
        const apps = JSON.parse(require("fs").readFileSync(0, "utf8"));
        const seen = new Set(), rows = [];
        for (const a of apps) {
          const n = String(a.name).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
          if (!n || seen.has(n)) continue;
          seen.add(n);
          const e = a.pm2_env || {}, m = a.monit || {};
          rows.push([n, e.status === "online" ? 1 : 0, Number(e.restart_time) || 0, Number(m.memory) || 0]);
        }
        const out = [];
        const metric = (name, type, help, i) => {
          out.push(`# HELP ${name} ${help}`, `# TYPE ${name} ${type}`);
          for (const r of rows) out.push(`${name}{app="${r[0]}"} ${r[i]}`);
        };
        metric("ezac_pm2_online", "gauge", "1 when pm2 reports the app online.", 1);
        metric("ezac_pm2_restarts_total", "counter", "Restarts pm2 has done for the app since it was started.", 2);
        metric("ezac_pm2_memory_bytes", "gauge", "Resident memory of the app.", 3);
        console.log(out.join("\n"));' 2>/dev/null && pm2_up=1
    fi
  fi
  meta ezac_pm2_up gauge "1 when the pm2 daemon answered."
  echo "ezac_pm2_up $pm2_up"

  meta ezac_metrics_last_run_timestamp_seconds gauge "When this script last ran."
  echo "ezac_metrics_last_run_timestamp_seconds $(date +%s)"
} >"$tmp" || exit 1

# A full disk can leave a truncated file: keep the previous one instead.
tail -n1 "$tmp" | grep -q '^ezac_metrics_last_run_timestamp_seconds [0-9]' || exit 1
chmod 644 "$tmp" && mv -f "$tmp" "$OUT" || exit 1
trap - EXIT
