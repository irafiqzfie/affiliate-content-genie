Deploying Affiliate Content Genie to Vercel

This document lists the exact steps, environment variables, and tips to deploy this Next.js app on Vercel (or similar hosts). It includes Prisma migration guidance and how to test OAuth callbacks locally using ngrok.

Required environment variables (Vercel - Production)
- DATABASE_URL — Postgres connection string for production (recommended). Example:
  `postgres://USER:PASSWORD@HOST:5432/DATABASE`

- NEXTAUTH_URL — Your Vercel app URL, e.g. `https://affiliate-content-genie.vercel.app`
- NEXTAUTH_SECRET — A long, random secret for NextAuth (32+ bytes, base64 recommended)
- FACEBOOK_CLIENT_ID / FACEBOOK_CLIENT_SECRET — Facebook OAuth app credentials
- API_KEY — External generative API key (Gemini / other)

Set these in the Vercel dashboard under Project → Settings → Environment Variables. Add them for Production and Preview environments as appropriate.

Vercel Build & Install Settings
- Install Command: `npm ci`
- Build Command: `npm run build && npm run prisma:deploy`
- Output Directory: leave default (Next.js App Router)

Important: The `prisma:deploy` script runs `prisma migrate deploy` to apply migrations to your production database. Ensure `DATABASE_URL` points to your production Postgres before deployment.

Prisma notes
- Local development uses SQLite by default (see `.env.local` with `DATABASE_URL="file:./dev.db"`).
- For production, switch `DATABASE_URL` to Postgres and ensure the `provider` in `prisma/schema.prisma` is `postgresql` (you may need to create a new migration targeting Postgres).
- Run migrations on your admin machine or CI (recommended) using the following commands:

PowerShell example:

```
# set production DATABASE_URL in your shell or CI, then run:
npx prisma migrate deploy
```

Do NOT run `prisma migrate dev` against production databases.

Local testing (OAuth & webhooks)
- Many provider dashboards require HTTPS for redirect / webhook URLs (Facebook requires HTTPS for uninstall/delete callbacks). Use ngrok for local testing. Example:

PowerShell example:

```
ngrok http 3000
```

Copy the generated https://xxxxx.ngrok.app URL and set `NEXTAUTH_URL` in your local `.env.local` to that value while testing locally.

Update provider settings (Redirect URI and Webhook URLs) in the provider dashboard to use the ngrok URL when testing locally.

Quick redeploy checklist
1. Confirm the Vercel project is connected to this repository/branch.
2. Add the required environment variables in Vercel (Production).
3. Ensure a production Postgres instance is ready and `DATABASE_URL` points to it.
4. Push your branch to trigger Vercel deployment or use the Vercel dashboard to redeploy.

Troubleshooting
- Build fails with missing env var: add the missing env var in Vercel and re-deploy.
- NextAuth sign-in errors: confirm `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, and provider secrets are correct, and provider redirect URIs match exactly.
- Prisma connection errors: verify `DATABASE_URL` and firewall/network rules allow Vercel to connect to your DB.

Optional: CI Migration step (GitHub Actions)
Create a small GitHub Action that runs `npx prisma migrate deploy` against your production DB before Vercel deployment if you prefer automated DB migrations.

If you want, I can add a sample GitHub Actions workflow that runs migrations and builds the project before Vercel picks up the build.

## Moving from SQLite (dev) → Postgres (production)

If you currently use SQLite locally and want production to run Postgres (recommended on Vercel), follow these steps.

1) Verify schema is set to `provider = "postgresql"` in `prisma/schema.prisma` (this repo has been updated to postgresql).

2) Create a Postgres database (Vercel Postgres, Supabase, Neon, Railway, etc.) and obtain the connection string (example):

```
postgres://USER:PASSWORD@HOST:5432/DATABASE
```

3) Locally, create a fresh migration for Postgres (this will generate SQL tailored for Postgres):

```powershell
# set DATABASE_URL to the Postgres database for the migration creation step
#$env:DATABASE_URL = 'postgres://user:pass@host:5432/dbname'
npx prisma migrate dev --name init-postgres
```

Note: `prisma migrate dev` creates a migration and also applies it. Use this locally or on an admin machine — do NOT run it directly on production CI.

4) Inspect the generated migration under `prisma/migrations/*` — confirm it looks correct for Postgres.

5) Apply migrations on production (CI or admin machine) using:

```powershell
# with DATABASE_URL set to the production Postgres URL
npx prisma migrate deploy
```

Data migration strategies (if you have existing data in SQLite you need to preserve):
- Export + import: export data from SQLite (via `sqlite3` or a small script) and import into Postgres. Write scripts to transform any differences (e.g., boolean/integer, timestamps).
- Use an ETL tool: tools like `pgloader` can help move data from SQLite → Postgres with minimal manual work.
- Recreate sample data: if you don't need production data, you can seed the Postgres DB with the current fixtures/seeds and start fresh.

If you'd like, I can help generate an export/import script for your current SQLite schema (dump JSON or CSV per table and import into Postgres) and test it locally.

