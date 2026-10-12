// Runs `next <args>` trusting the UAT gateway's self-signed certificate.
// Usage: node scripts/with-uat-cert.mjs dev
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const cert = resolve("certs/uat-ezac.pem");
if (!existsSync(cert)) {
  console.error(`Missing ${cert}. Ask a teammate for the UAT certificate (it isn't in git).`);
  process.exit(1);
}

// pnpm forwards a literal "--" separator; drop it.
const args = process.argv.slice(2).filter((arg) => arg !== "--");
const child = spawn(["next", ...args].join(" "), {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NODE_EXTRA_CA_CERTS: cert },
});
child.on("exit", (code) => process.exit(code ?? 1));
