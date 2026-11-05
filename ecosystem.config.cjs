// pm2 process for the deployed web app. deploy.sh starts or restarts it with:
//   pm2 startOrRestart ecosystem.config.cjs --update-env
//
// What the server needs before a deploy (see README.md, "Environment variables"):
//   API_BASE_URL          Required. The gateway's address, e.g. https://gateway.example.
//                         There is no default: without it the app logs a startup error
//                         and every gateway call fails.
//   NODE_EXTRA_CA_CERTS   While the gateway uses the UAT self-signed certificate: the
//                         path to that certificate, e.g. /var/www/ezac/certs/uat-ezac.pem.
//                         Remove it once the gateway has a certificate from a public CA.
//   ALLOW_INSECURE_AUTH_COOKIES=true
//                         Only if the site is served over plain HTTP (no TLS in front).
//                         Without it, sign-in cookies are Secure and need HTTPS.
//   SITE_URL, TRUST_ROLELESS_ACCOUNTS, GIT_SHA: optional, see README.md.
//
// Where to set them (either works):
//   1. /var/www/ezac/.env.production, one KEY=value per line. Next reads it at build
//      and at start. Best for values that rarely change.
//   2. `export KEY=value` in deploy.sh before `pm2 startOrRestart`.
// Each variable below is read from the deploy shell, then from .env.production,
// and passed to the process on every restart. That matters because pm2 keeps
// every variable an older config set (`--update-env` adds and changes, never
// removes): a value only in .env.production would otherwise lose to a stale one.
//
// ONCE, when moving from the old config (which hard-coded the UAT gateway IP and
// certificate): set the values in .env.production or deploy.sh, then run
//   pm2 delete ezac && pm2 start ecosystem.config.cjs && pm2 save
// so the old API_BASE_URL and NODE_EXTRA_CA_CERTS are dropped.

const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { parseEnv } = require("node:util");

const PASS_THROUGH = [
  "API_BASE_URL",
  "NODE_EXTRA_CA_CERTS",
  "GIT_SHA",
  "SITE_URL",
  "ALLOW_INSECURE_AUTH_COOKIES",
  "TRUST_ROLELESS_ACCOUNTS",
];

// Node reads NODE_EXTRA_CA_CERTS only when the process starts, before Next loads
// .env.production, so values in that file are passed from here as well.
function readEnvFile() {
  try {
    return parseEnv(readFileSync(`${__dirname}/.env.production`, "utf8"));
  } catch {
    // No file, or a Node without util.parseEnv: rely on the deploy shell.
    return {};
  }
}
const envFile = readEnvFile();
function fromEnvFile(key) {
  return envFile[key] || undefined;
}

const passed = Object.fromEntries(
  PASS_THROUGH.map((key) => [key, process.env[key] || fromEnvFile(key)]).filter(([, value]) => value),
);

// The release id in error logs. deploy.sh should export GIT_SHA; failing that,
// read the commit checked out in the app folder.
function currentCommit() {
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], { cwd: __dirname, encoding: "utf8" }).trim() || undefined;
  } catch {
    return undefined;
  }
}

const gitSha = passed.GIT_SHA ?? currentCommit();

module.exports = {
  apps: [
    {
      name: "ezac",
      cwd: __dirname,
      script: `${__dirname}/node_modules/next/dist/bin/next`,
      args: `start -p ${process.env.PORT ?? 3000}`,
      env: {
        ...passed,
        ...(gitSha ? { GIT_SHA: gitSha } : {}),
        NODE_ENV: "production",
      },
      // next start finishes in-flight requests on SIGINT; give it time before pm2 kills it.
      kill_timeout: 15000,
      // Restart instead of letting a leak take the server down.
      max_memory_restart: "1G",
      // Timestamps on every line; stdout and stderr of restarts share one file each.
      time: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
