<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# A Week on My Desk

Personal weekly music newsletter: Next.js site + email, sent Sundays at 4pm.

Read `PLAN.md` before proposing architecture. It holds every decision made so far and the build order. Update it when a decision changes. `docs/decisions/` is the short record of individual calls; `docs/email-safe-fonts.md` is the font-fallback reference.

Package manager is npm. Scripts run as `npm run <script>`.

## Layout

- `content/issues/<YYYY-MM-DD>.mdx` is the issue body. The slug is the send date and the URL (`/issues/<slug>`).
- `src/content/issues.ts` is the registry, newest first. Issues are imported from here (`loadIssue`); they are not App Router pages. `next.config.ts` leaves `pageExtensions` at the default so an `.mdx` file never becomes a route.
- `src/content/blocks.ts` is the block vocabulary. `src/components/blocks/email.tsx` is the only renderer. `src/components/site/` is the inbox chrome; `Letter.tsx` shows that email HTML inline.
- `src/app/` is the App Router: `/` (signup), `/issues`, `/issues/[slug]`, `/issues/[slug]/email`, `/issues/[slug]/share`, `/issues/[slug]/story/[block]`, `/issues/[slug]/post`, `/about`, `/admin`, `/dev/components` (development only), `/subscribe/confirm`, `/unsubscribe`, `/api/subscribe`, `/api/unsubscribe`, `/api/webhooks/relay`, `/feed.xml`, `/sitemap.xml`, `/robots.txt`.
- `src/email/` renders confirm and welcome mail and talks to the relay (`relay.ts`). `src/db/supabase.ts` is the service-role client (`server-only`). `src/images/` builds story and link-preview images.
- `src/design/tokens.ts` holds colour and type as literal strings. `src/app/globals.css` restates them for Tailwind. `src/design/tear.ts` is the torn-paper shape.
- `public/covers/` and `public/brand/` are served assets. `assets/` holds logo and font source files.
- `supabase/migrations/` is the schema: `subscribers`, `sends`, `events`. Nothing else belongs in the database.
- `scripts/` is send, new-issue detection, the token check, and the tear-image generators. `.github/workflows/send-issue.yml` sends a newly registered issue on push to `main`.

## Run, build, lint

```
npm install
npm run dev
```

- `npm run build`, then `npm run start`, for a production server.
- `npm run lint` runs ESLint (`eslint-config-next`).
- `npm run tokens:check` fails if `globals.css` drifts from `src/design/tokens.ts`.
- There is no test runner and no test script.

`npm run send` loads `.env.local` when it exists (`--env-file-if-exists`). It fetches the email from the running app; it does not render the issue itself.

```
npm run send -- --issue 2026-09-27 --to me
npm run send -- --issue 2026-09-27 --to list --dry-run
npm run send -- --issue 2026-09-27 --to list
```

`--to me` goes to `SEND_SELF_TO` and records nothing. `--to list` is every confirmed subscriber, claimed in `sends` first so a recipient cannot get the same issue twice and a stopped run resumes.

`npm run banner`, `npm run divider`, and `npm run footer` bake the torn-paper PNGs into `public/brand/`.

The send workflow uses Node 24. There is no `engines` field.

## Adding an issue

1. Write `content/issues/<YYYY-MM-DD>.mdx`. Prose is markdown. Blocks, all rendered by `email.tsx`: `Album` (same component as `Media`), `Track`, `Section`, `PullQuote` (`text`, not children), `Aside` (`text`), `Image`, `Divider` (`tear` for the torn break). Props are in `src/content/blocks.ts`. Put covers in `public/covers/` and reference them as `/covers/...`.
2. Prepend an entry to `issues` in `src/content/issues.ts`: `slug`, zero-padded `number`, `title`, `date`, `preview`, and optional `covers` (three public paths, picked for colour). The registry is explicit; files are not discovered by glob.
3. Preview at `/issues/<slug>`. Raw HTML is `/issues/<slug>/email`; `?text=1` is the plain-text part; `?welcome=1` is the confirm-time welcome. `/dev/components` renders every block and 404s outside development.
4. Self-send before merging, with the app running: `npm run send -- --issue <slug> --to me`. Point `SEND_ORIGIN` at that app. A list send refuses a render that still contains localhost URLs, so set `SITE_URL` when the render is for a real recipient.
5. Merging a new `src/content/issues.ts` entry to `main` publishes the issue. `.github/workflows/send-issue.yml` sends it only when the repository variable `AUTO_SEND` is `true`, and only for slugs `scripts/new-issues.mts` finds newly added. Editing an issue that is already registered does not send.

If an MDX edit does not appear, Turbopack can serve the previous compilation. Delete `.next` and rebuild.

## Environment

Copy `.env.example` to `.env.local`. Never commit values. Names the code reads:

- `SEND_ORIGIN`: where `npm run send` fetches the render. Defaults to `http://localhost:3000`.
- `SITE_URL`: absolute origin baked into email image and link URLs.
- `SEND_FROM`, `SEND_REPLY_TO`, `SEND_SELF_TO`.
- `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET` (`/api/webhooks/relay`).
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: service role, not the anon key. The browser never talks to Postgres.
- `ADMIN_PASSWORD`: gates `/admin` (`src/admin/session.ts`). Unset, nobody gets in. It is not listed in `.env.example`.

The public site renders without these. Subscribe, confirm, welcome, unsubscribe, admin, webhooks, and send need the database and, where mail goes out, Resend.

The send workflow's secrets are `SEND_FROM`, `SEND_REPLY_TO`, `RESEND_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. It sets `SEND_ORIGIN` to the production site itself. `AUTO_SEND` is a repository variable, not a secret.

## Conventions

- Issues are MDX in the repo. Subscribers, sends, and tracking events are the only things in the database.
- Every content block has one renderer, the email HTML in `src/components/blocks/email.tsx`, and the site shows that render inline. Never add markup email cannot show: inline styles, table layout, absolute image URLs with explicit dimensions. Adding a block means a component in that file plus its props in `src/content/blocks.ts`.
- Design system: cream page, navy app bar, orange accents. The site is an inbox; the letter carries its own navy banner and footer. Source files in `assets/`.
- Colour and type used in email come from `src/design/tokens.ts` as strings. Email HTML cannot read CSS custom properties. Run `npm run tokens:check` after touching either file.
- Keep relay and database access behind `src/email/relay.ts` and `src/db/supabase.ts`.
- `@/*` maps to `src/*`. Scripts in `scripts/*.mts` import those modules with a `.ts` extension; Node runs them with type stripping.
