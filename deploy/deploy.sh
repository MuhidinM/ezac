#!/usr/bin/env bash
# EZAC web deploy, blue/green on 127.0.0.1:3000 (blue) and 127.0.0.1:3001 (green).
#
# Installed on the server as /var/www/ezac/deploy.sh (0700, ezaacadmin). It is the
# forced command of the GitHub Actions key, and can be run by hand:
#   deploy.sh deploy <40-character sha>   build, start on the idle colour, health-check, switch nginx
#   deploy.sh rollback                    switch nginx back to the other colour (previous release)
#   deploy.sh status                      show which release is live
#
# Each release is built in its own folder (releases/<sha>) while the live one keeps
# serving. nginx switches only after the new one answers its health check; the old
# colour keeps running as nginx's backup and as an instant rollback.
set -Eeuo pipefail
umask 022

BASE=/var/www/ezac
SRC=$BASE/ezac                         # git checkout used only as the source (fetch + archive)
RELEASES=$BASE/releases
SHARED=$BASE/shared                    # .env.production and the UAT gateway certificate
STATE=$BASE/state
KEEP=5
# The pnpm version comes from package.json "packageManager" (corepack), the same one
# CI and laptops use, and installs exactly what pnpm-lock.yaml says.
INSTALL_CMD=(corepack pnpm install --frozen-lockfile)
BUILD_CMD=(corepack pnpm build)

export HOME=/home/ezaacadmin PM2_HOME=/home/ezaacadmin/.pm2 PATH=/usr/local/bin:/usr/bin:/bin
export NEXT_TELEMETRY_DISABLED=1 CI=1 COREPACK_ENABLE_DOWNLOAD_PROMPT=0

log() { printf '%s %s\n' "$(date '+%F %T')" "$*"; }
die() { log "FAILED: $*"; exit 1; }

# The workflow sends "deploy <sha>"; older runs send "GIT_SHA=<sha> bash .../deploy.sh".
CMD="${SSH_ORIGINAL_COMMAND:-$*}"
case "$CMD" in
  *rollback*) ACTION=rollback ;;
  *status*) ACTION=status ;;
  *) ACTION=deploy ;;
esac
SHA=$(grep -oE '\b[0-9a-f]{40}\b' <<<"$CMD" | head -1 || true)

mkdir -p "$RELEASES" "$STATE"
exec 9>"$BASE/.deploy.lock"
flock -n 9 || die "another deploy or rollback is running"
# Keep pm2 (and the apps it forks) from inheriting the lock, which would block every later deploy.
pm2() { command pm2 "$@" 9>&-; }
touch "$BASE/deploy.log" && chmod 600 "$BASE/deploy.log"
exec > >(tee -a "$BASE/deploy.log") 2>&1
trap 'log "FAILED at line $LINENO: $BASH_COMMAND"' ERR

active() { cat "$STATE/active-color" 2>/dev/null || echo blue; }
other() { [ "$1" = blue ] && echo green || echo blue; }
port() { [ "$1" = blue ] && echo 3000 || echo 3001; }
linkof() { [ -L "$1" ] && readlink -f "$1" || true; }   # empty when the link doesn't exist

# Healthy = /bff/health answers (with the expected release when given) and the home page renders.
healthy() { # <port> [sha]
  local body i
  for i in $(seq 1 45); do
    if body=$(curl -fsS --max-time 5 "http://127.0.0.1:$1/bff/health" 2>/dev/null) &&
      { [ -z "${2:-}" ] || [[ $body == *"\"release\":\"$2\""* ]]; } &&
      curl -fsS -o /dev/null --max-time 20 -H 'Host: ezaac.com' -H 'X-Forwarded-Proto: https' "http://127.0.0.1:$1/"; then
      return 0
    fi
    sleep 2
  done
  return 1
}

start_colour() { # <colour> <dir> <sha>
  local name="ezac-$1"
  pm2 delete "$name" >/dev/null 2>&1 || true
  # The process from before blue/green listens on :3000 under the name "ezac".
  [ "$1" = blue ] && { pm2 delete ezac >/dev/null 2>&1 || true; }
  # A clean environment: everything else comes from shared/.env.production, which
  # ecosystem.config.cjs reads (NODE_EXTRA_CA_CERTS must be set before Node starts).
  # Fresh logs per start, so a failure shows only this release's output.
  rm -f "$PM2_HOME/logs/$name-out.log" "$PM2_HOME/logs/$name-error.log"
  (cd "$2" && env -i HOME="$HOME" PATH="$PATH" PM2_HOME="$PM2_HOME" PM2_NODE=/usr/bin/node \
    PM2_APP_NAME="$name" PORT="$(port "$1")" GIT_SHA="$3" EZAC_DEPLOYMENT_ID="$3" \
    pm2 start ecosystem.config.cjs --only "$name" >/dev/null 9>&-)
}

switch_to() { sudo -n /usr/local/sbin/ezac-switch-web "$1"; echo "$1" >"$STATE/active-color"; }

build() { # <sha> <dir>
  rm -rf "$2"
  mkdir -p "$2"
  git -C "$SRC" archive "$1" | tar -x -C "$2"
  ln -s "$SHARED/.env.production" "$2/.env.production"
  # Reuse the previous build cache so builds stay fast.
  local seed
  seed=$(linkof "$BASE/current")
  [ -n "$seed" ] || seed=$SRC
  if [ -d "$seed/.next/cache" ]; then mkdir -p "$2/.next" && cp -a "$seed/.next/cache" "$2/.next/" || true; fi
  (
    cd "$2"
    # Next reads .env.production itself; Node needs the gateway certificate before it starts.
    local ca
    ca=$(sed -n 's/^NODE_EXTRA_CA_CERTS=//p' "$SHARED/.env.production" | tail -1)
    [ -n "$ca" ] && export NODE_EXTRA_CA_CERTS="$ca"
    # GIT_SHA is the deploymentId (version-skew protection) baked into the build.
    export GIT_SHA="$1" EZAC_DEPLOYMENT_ID="$1"
    nice -n 10 ionice -c3 "${INSTALL_CMD[@]}"
    nice -n 10 ionice -c3 "${BUILD_CMD[@]}"
    touch .build-ok
  )
}

prune() {
  local cur prev d
  cur=$(linkof "$BASE/current")
  prev=$(linkof "$BASE/previous")
  ls -1dt "$RELEASES"/*/ 2>/dev/null | sed 's#/$##' | tail -n +$((KEEP + 1)) | while read -r d; do
    if [ "$d" != "$cur" ] && [ "$d" != "$prev" ]; then
      log "pruning $d"
      rm -rf "$d"
    fi
  done
}

# The server's link to GitHub sometimes resets mid-fetch: try a few times.
fetch_master() {
  local i
  for i in 1 2 3 4; do
    timeout 180 git -C "$SRC" fetch -q origin master && return 0
    log "git fetch failed (attempt $i); retrying"
    sleep $((i * 10))
  done
  die "could not fetch master from GitHub"
}

deploy() {
  [[ $SHA =~ ^[0-9a-f]{40}$ ]] || die "usage: deploy <40-character commit sha>"
  fetch_master
  git -C "$SRC" merge-base --is-ancestor "$SHA" origin/master || die "$SHA is not on master"
  local live target dir=$RELEASES/$SHA prev
  live=$(active)
  target=$(other "$live")
  if [ "$(linkof "$BASE/current")" = "$dir" ] && healthy "$(port "$live")" "$SHA"; then
    log "$SHA already live on $live"
    return 0
  fi
  if [ -f "$dir/.build-ok" ]; then log "reusing build of $SHA"; else
    log "building $SHA"
    build "$SHA" "$dir"
  fi
  log "starting $SHA as $target on :$(port "$target")"
  start_colour "$target" "$dir" "$SHA"
  if ! healthy "$(port "$target")" "$SHA"; then
    # App logs can hold phone numbers and IPs: keep them on the server, never in the (public) CI log.
    local f="$STATE/failed-$SHA.log" p
    (umask 077; pm2 logs "ezac-$target" --nostream --lines 80 >"$f" 2>&1 || true)
    pm2 delete "ezac-$target" || true
    # Put the previous release back on this colour so nginx keeps a backup and rollback still works.
    p=$(linkof "$BASE/previous")
    if [ -n "$p" ] && [ -f "$p/.build-ok" ]; then
      start_colour "$target" "$p" "$(basename "$p")"
      healthy "$(port "$target")" || log "could not restore $(basename "$p") as standby"
      pm2 save --force >/dev/null
    fi
    die "$SHA failed its health check; $live keeps serving. App output: $f (server only)"
  fi
  switch_to "$target"
  # The first blue/green deploy replaces the old in-place app, which stays running as the standby.
  prev=$(linkof "$BASE/current")
  ln -sfn "${prev:-$SRC}" "$BASE/previous"
  ln -sfn "$dir" "$BASE/current"
  pm2 save --force >/dev/null
  log "LIVE: $SHA on $target; $live stays up as nginx backup and instant rollback"
  prune
}

rollback() {
  local live standby prev
  live=$(active)
  standby=$(other "$live")
  prev=$(linkof "$BASE/previous")
  [ -n "$prev" ] || die "no previous release recorded"
  healthy "$(port "$standby")" || die "standby $standby is not answering; redeploy the previous sha instead"
  switch_to "$standby"
  # Content changed while it was standby may still be cached there.
  curl -fsS -o /dev/null --max-time 5 -X POST "http://127.0.0.1:$(port "$standby")/bff/internal/expire-public" || true
  ln -sfn "$(linkof "$BASE/current")" "$BASE/previous"
  ln -sfn "$prev" "$BASE/current"
  pm2 save --force >/dev/null
  log "ROLLED BACK: serving $(basename "$prev") on $standby"
}

status() {
  log "active=$(active) current=$(basename "$(linkof "$BASE/current")") previous=$(basename "$(linkof "$BASE/previous")")"
  pm2 ls
}

case "$ACTION" in
  deploy) deploy ;;
  rollback) rollback ;;
  status) status ;;
esac
