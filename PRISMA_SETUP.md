Prisma setup (Postgres + Vercel)

This project is configured to use PostgreSQL (recommended for production). For local development you can run a local Postgres instance, use Docker, or continue to use SQLite by setting the `DATABASE_URL` to a SQLite file (see "Local dev with SQLite" below).

Prereqs
- Node.js, npm
- A Postgres instance (Supabase, Neon, or local Docker)

1) Install dependencies

```powershell
npm install
```

2) Local dev options

- Quick (SQLite): set `DATABASE_URL="file:./dev.db"` in `.env.local` and run migrations as below.
- Postgres (recommended): create a free Supabase project or run Postgres in Docker and set `DATABASE_URL` to your connection string (e.g., `postgresql://user:pass@localhost:5432/dbname`).

3) Run migrations & generate client

```powershell
npx prisma migrate dev --name init
npx prisma generate
```

4) Optional: Prisma Studio (DB viewer)

```powershell
npx prisma studio
```

5) Start dev server

```powershell
npm run dev
```

Vercel deployment notes
- Create a production Postgres database (Supabase, Neon, or similar).
- In Vercel, set the environment variable `DATABASE_URL` to your Postgres connection string.
- Also set these env vars for production if you add OAuth later:
	- `NEXTAUTH_SECRET` (random long string)
	- OAuth provider client ids/secrets (e.g., `GOOGLE_ID`, `GOOGLE_SECRET`).
If you plan to use our built-in OAuth callback route (Facebook / Threads placeholder), also add:
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`
- `THREADS_CLIENT_ID` (if available)
- `THREADS_CLIENT_SECRET` (if available)
- When you deploy, Vercel will run your build and the Prisma client will use the `DATABASE_URL` set in the environment.

If you need to run migrations in production (not recommended via Vercel build step for safety), use a CI step or manual `prisma migrate deploy` against the production DB.

Troubleshooting
- If you see errors about multiple PrismaClient instances in development, the `src/lib/prisma.ts` wrapper is included to prevent that.
- If you want to keep SQLite locally but use Postgres in production, set `DATABASE_URL` accordingly in `.env.local` and on Vercel.

