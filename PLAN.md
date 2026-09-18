# A Week on My Desk — Plan

Decided 2026-09-18 in a planning interview. This is the shared understanding the
build starts from. Revise it when a decision changes; don't let it drift silently.

## What it is

A weekly music newsletter. One email, Sundays at 4pm, plus a small website.
Written by Max, sent to friends and family first, architected to scale to a few
hundred readers without a rewrite.

Goals, in Max's words:
1. Get more personalized music recommendations back from readers.
2. Write thoughts out to understand the music more deeply.
3. Connect with friends and family, and maybe inspire them to do the same.

First issue: Sunday 2026-09-20, 4pm. Quality over speed; ship when it's right.

## Principles

- **Own the content and the list. Rent delivery.** Issues live in git. Subscribers
  live in a database we control. The email relay is a config value.
- **The email constraint is the design constraint.** Every block renders to both
  web and email. Nothing gets authored that email can't show.
- **Don't build admin UIs until the file workflow hurts.**
- **Every platform dependency sits behind a resolver or adapter** so swapping it
  is a file change, not a migration.

## Stack

| Concern | Choice | Notes |
|---|---|---|
| App | Next.js, TypeScript | Site, preview, send command, webhooks |
| Hosting | Vercel | Free tier. Portable if that changes. |
| Database | Supabase Postgres | Subscribers, sends log, tracking events. Nothing else. |
| Email relay | Resend (or Postmark/SES) | Delivery + open/click tracking + webhooks only |
| Email templates | React Email | Compiles blocks to table-based email HTML |
| Domain | awomd.com, Namecheap BasicDNS | Send from a subdomain (e.g. send.awomd.com). From shows awomd.com. |
| Replies | Namecheap email forwarding | max@awomd.com → personal inbox. MX on root, no collision with relay subdomain. |
| Music metadata | Spotify Web API | Behind a resolver interface. No 30s previews for new apps; "listen" = link out. |

## Content model

An **issue** is one MDX file in the repo: title, date, intro, ordered list of
sections. A **section** is a heading plus an ordered list of blocks.

Initial block palette (will grow; the abstraction is what's fixed):

- **Prose** — markdown.
- **AlbumCard** — cover, artist, title, year, pills, listen link, prose beneath.
  Can nest Tracks.
- **Track** — title, artist, pills, listen link, one-line note. Standalone or
  nested under an AlbumCard.
- **MediaCard** — same shape as AlbumCard for non-music (documentary, book,
  show). Different resolver or hand-entered.
- **Pills** — freeform strings on any card ("rage", "acoustic", "twangy").
- **Divider**, **PullQuote**, **Image**, **PlaylistLink** as needed.

Every block type has exactly two renderers: `web` and `email`. Adding a block
type is adding a file.

### Resolvers

Issue files never say "Spotify". They say `<Album href="..."/>`. The build
picks a resolver by URL, which returns a canonical record:

```
{ kind, artist, title, year, coverUrl, links: { spotify?, apple?, bandcamp? } }
```

- Resolved records are cached as JSON in the repo next to the issue and
  committed. Builds are deterministic and survive API changes.
- Cover art is downloaded at resolve time and served from our domain.
- Universal links (Odesli) are a future resolver for non-Spotify readers.

## Authoring workflow

1. Write the issue as an MDX file in the editor. Notes drafted anywhere
   (Apple Notes exports Markdown) get pasted in.
2. `next dev` shows a live preview at the issue URL with a toggle between the
   web render and the email render.
3. A dev-only **components gallery** route renders every block in both forms
   with sample data. This is the design surface and the email regression check.
4. Later, if typing tags gets annoying: Keystatic (git-backed block editor,
   writes the same files). Not before.

## Design

Direction read from the logo (blocky extruded orange letters on navy):

- **Cream page background** (sample exact value from the reference file).
- **Navy banner** top and bottom, logo in the header, unsubscribe/reply in the
  footer.
- **Navy body text**, not black.
- **Orange is scarce**: pills, links, section-title accents.
- **Heavy condensed display face** for section titles; readable serif or plain
  sans for prose. Must look intentional when it degrades to system fonts.
- **Cover art carries the color.** Everything else stays restrained.
- **Texture** only on the site header and logo, never in email components.
- **Dark mode handled explicitly**: `color-scheme` meta, tested on iPhone
  Apple Mail and Gmail in dark mode before the first send.

Design happens in code, in the components gallery. No Figma step.

Logo: needs the real file, plus a transparent-background PNG at 2x display size,
hosted on our domain for the email header.

## Publishing

A command (not cron, not a button, for now):

```
npm run send -- --issue 2026-09-20 --to me      # renders, sends to Max only
npm run send -- --issue 2026-09-20 --to list    # sends to all confirmed subscribers
```

- Self-send is a required first step. Read it on a phone in Gmail and Apple
  Mail before sending to the list.
- The `sends` table makes it idempotent: a recipient can't get the same issue
  twice, and a half-failed send resumes.
- Every email carries `List-Unsubscribe` and `List-Unsubscribe-Post` headers
  for one-click unsubscribe in Gmail/Apple Mail.
- Footer unsubscribe link works on first click, no login, no confirmation page.
- Physical mailing address in the footer is **deferred** (Max is arranging one).

## Subscribers

- **Double opt-in.** Form → confirmation email → confirm link → subscribed.
- Subscribe form ships with the site; the first send can go to a hand-made list.
- Tables: `subscribers` (email, status, tokens, timestamps), `sends`
  (subscriber, issue, sent_at, relay message id), `events` (subscriber, issue,
  type, link, timestamp — raw relay webhook events).

## Tracking

Track as much as possible now; scale down later.

- Relay-provided open and click tracking, toggled on. We store the webhook
  events raw and never build the pixel or redirect ourselves.
- Opens overcount (Apple Mail preloads). Treat opens as a floor, clicks as
  signal.
- Listen links carry `?i=<issue>&b=<block>` so link identity is ours regardless
  of relay.

## Website

- `/` — the latest issue, full render, subscribe form.
- `/issues` — archive list.
- `/issues/[slug]` — permalink, also the "read in browser" target.
- `/about`
- `/subscribe/confirm`, `/unsubscribe` — token endpoints.
- `/dev/components` — gallery, dev only.

## Build order for the first issue

1. Repo: Next.js + TypeScript + Tailwind, Supabase client, React Email. Commit.
2. Issue file format and the block types: Prose, AlbumCard, Track, MediaCard,
   Pills. Web renderers first.
3. Spotify resolver + JSON cache + cover mirroring.
4. Components gallery route. Establish the cream/navy/orange system there.
5. Email renderers for every block. Preview toggle. Dark mode handling.
6. Site pages: home, archive, permalink, about.
7. DNS: relay domain verification on the send subdomain, email forwarding on
   the root, point root/www at Vercel, delete Namecheap's default www redirect.
8. Supabase schema. Subscribe form, confirm, unsubscribe, List-Unsubscribe.
9. Send command with self-send and idempotent list send.
10. Relay webhooks → events table.
11. Write the first issue. Self-send. Test on phone in light and dark. Send.

## Deferred (explicitly not now)

- Favicon decision: A glyph is the placeholder. Options on the table are the
  full wordmark everywhere, or a split (A glyph at 16/32px, wordmark at 180/512px).

- Postal address in footer
- Apple Music / Bandcamp resolvers, Odesli universal links
- Keystatic or any editor UI
- Feedback form (replies are the feedback mechanism)
- Tag pages
- Scheduled/automatic sends
- Analytics dashboard (queries on `events` suffice)
- Custom domain for the components gallery or any auth
