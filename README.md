# IACEC website

Website and content management system for the **Innovation Association for Christian Educators** (Douala, Cameroon).

- **Public site** — a faithful rebuild of the reference design (`https://raise-godly-growth.base44.app/`): same pages, URLs, copy, colours, typography, spacing and responsive behaviour. See [`DESIGN_NOTES.md`](DESIGN_NOTES.md).
- **Admin** at `/admin` — every word, image, link, list, form question and contact detail on the public site is stored in the database and editable here. See [`ADMIN_GUIDE.md`](ADMIN_GUIDE.md) for staff.

**Stack:** Next.js 15 (App Router, TypeScript strict, Server Components + Server Actions) · Tailwind CSS 3 with the reference site's design tokens · PostgreSQL + Prisma · Auth.js v5 (email + password, bcrypt, roles) · S3-compatible storage (R2 / S3 / Supabase) · Resend or SMTP · Zod · Tiptap · Playwright.

---

## 1. Local setup

Requirements: **Node.js 20+** and a PostgreSQL database (any version ≥ 14).

```bash
npm install
cp .env.example .env          # then edit .env
```

No PostgreSQL installed? Start a throw-away one (keeps running in that terminal):

```bash
npm run db:local
```

and use `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/iacec?schema=public"` in `.env`.

Create the tables, load the content and create the first administrator:

```bash
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open http://localhost:3000 for the site and http://localhost:3000/admin for the admin (sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`).

### Environment variables

All variables are documented in [`.env.example`](.env.example). Summary:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | Secret for signing admin sessions (`npx auth secret`) |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://iacecglobal.com` — canonical URLs, sitemap, emails |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | for seeding | First administrator account |
| `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | production | Image/file uploads. Without them, uploads go to `public/uploads` (development only) |
| `EMAIL_FROM` + `RESEND_API_KEY` **or** `SMTP_*` | production | Form notifications and auto-replies. Without them, emails are logged to the console |

## 2. Database: migrations and seed

- Schema: [`prisma/schema.prisma`](prisma/schema.prisma). Migrations: [`prisma/migrations`](prisma/migrations).
- Change the schema → `npx prisma migrate dev --name describe-change`.
- `npm run db:seed` fills an **empty** database with all live-site content (pages and sections, programmes, pillars, values, milestones, sponsorship steps, news, donation funds, volunteer areas, partnership types, menus, footer, settings and the nine forms) and registers the photographs in the media library. It never overwrites content that already exists, so it is safe to re-run.
- `npx tsx prisma/seed.ts --reset` replaces all **content** with the original (users, submissions and subscribers are kept).
- The original photographs live in `public/media/seed/` (WebP). `node scripts/fetch-seed-images.mjs` re-downloads them from the reference site.

### Creating another administrator

Sign in as an administrator → **Users → Invite someone**. To create one from the command line instead, set `ADMIN_EMAIL` / `ADMIN_PASSWORD` to the new account and run `npm run db:seed` again (it only creates the user if that email does not exist yet).

## 3. Deploying to Vercel

1. Push this repository to GitHub and import it in Vercel (framework: Next.js; build command `npm run build` is detected).
2. Create a Postgres database (Vercel Postgres / Neon / Supabase) and copy its connection string into `DATABASE_URL`.
3. Create a storage bucket:
   - **Cloudflare R2** (recommended): create a bucket, enable public access through a custom domain such as `media.iacecglobal.com`, create an API token. Set `S3_BUCKET`, `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `S3_REGION=auto`, keys, and `S3_PUBLIC_URL=https://media.iacecglobal.com`.
   - AWS S3 or Supabase Storage work the same way (S3 API).
4. Configure email: verify `iacecglobal.com` with [Resend](https://resend.com) and set `RESEND_API_KEY` and `EMAIL_FROM`.
5. Add the remaining variables from `.env.example` in **Vercel → Settings → Environment Variables**.
6. Run the migrations and seed once against the production database from your computer:
   ```bash
   DATABASE_URL="<production url>" npx prisma migrate deploy
   DATABASE_URL="<production url>" ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run db:seed
   ```
7. Deploy. Public pages are statically generated and refreshed automatically whenever something is saved in the admin (on-demand revalidation), so edits appear within seconds without a rebuild.

### Connecting iacecglobal.com

In Vercel → **Settings → Domains**, add `iacecglobal.com` and `www.iacecglobal.com`. At your domain registrar, create the records Vercel shows (usually an `A` record for the apex pointing to `76.76.21.21` and a `CNAME` for `www` pointing to `cname.vercel-dns.com`). Choose `iacecglobal.com` as the primary domain so `www` redirects to it. HTTPS certificates are issued automatically.

## 4. Project structure

```
prisma/                 schema, migrations, seed + seed-data (verbatim live content)
public/media/seed/      original photographs (WebP)
reference-screenshots/  live-site screenshots at 1440 / 768 / 390 px
src/app/(site)/         public routes: [[...slug]] (CMS pages), programmes/[slug], news/[slug]
src/app/admin/          admin: (auth)/login and (panel)/… pages, server actions in _actions/
src/app/api/            auth, media upload, CSV exports
src/sections/           one component per section type + definitions.ts (editable fields)
src/components/site/    header, footer, cards, forms — copied class-for-class from the reference
src/components/admin/   admin UI kit, field editor, media picker, rich-text editor
src/lib/                data access, settings schema, collections registry, permissions, storage, email
tests/                  Playwright: visual parity, site, forms, admin
```

How content works: a **Page** has ordered **Sections**. Each section has a `type` (e.g. `pageHero`, `ctaBand`, `formSection`) whose editable fields are declared once in `src/sections/definitions.ts`; the same declaration generates the admin form and the Zod validation. Lists that appear in several places (programmes, pillars, news…) are **collections** declared in `src/lib/collections.ts`.

## 5. Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

Playwright tests (run against a built site with a seeded database):

```bash
npx playwright install chromium      # or set PW_CHANNEL=msedge / chrome to use an installed browser
npm run build && npm run start       # in one terminal
ADMIN_EMAIL=… ADMIN_PASSWORD=… BASE_URL=http://localhost:3000 npm run test:e2e
```

- `tests/visual.spec.ts` compares every route at 1440 / 768 / 390 px with `reference-screenshots/`.
- `tests/site.spec.ts` checks headings, metadata, navigation, filters, 404, sitemap and robots.
- `tests/forms.spec.ts` submits every form and checks the success messages.
- `tests/admin.spec.ts` signs in, edits the home heading, swaps the hero image, checks the public site, and restores.

## 6. Security notes

- All `/admin` routes are protected by middleware; every server action and API route re-checks the user's role against the database (so deactivating a user takes effect immediately).
- Child sponsorship applications are visible only to Administrators and Sponsorship Coordinators, are never emailed in full (notifications only say a confidential submission arrived), and never appear on the public site.
- Forms: Zod validation on client and server, honeypot field `__trap`, per-connection rate limiting (6 submissions / 10 minutes), length limits.
- Rich text is sanitised (sanitize-html) before storage; CSV exports neutralise spreadsheet formulas.
- Security headers (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) are set in `next.config.ts`. Server Actions are CSRF-protected by Next.js (origin checks).
