// pm2 process for the deployed web app. deploy.sh starts or restarts it with:
//   pm2 startOrRestart ecosystem.config.cjs --update-env
// Values here win over the deploy shell's environment, so a restart never
// drops the certificate or the gateway address. Override any of them by
// exporting it before running deploy.sh.
module.exports = {
  apps: [
    {
      name: "ezac",
      cwd: __dirname,
      script: `${__dirname}/node_modules/next/dist/bin/next`,
      args: `start -p ${process.env.PORT ?? 3000}`,
      env: {
        NODE_ENV: "production",
        // The gateway the server-side code calls (login, back office, public figures).
        API_BASE_URL: process.env.API_BASE_URL ?? "https://196.188.249.232",
        // The UAT gateway's certificate is self-signed; trust it explicitly. It lives in
        // certs/ next to this file (ignored by git, so deploys leave it in place).
        NODE_EXTRA_CA_CERTS: process.env.NODE_EXTRA_CA_CERTS ?? `${__dirname}/certs/uat-ezac.pem`,
      },
    },
  ],
};
