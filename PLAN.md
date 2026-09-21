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
- **The email constraint is the design constraint.** Every block renders as
  email, and the website shows that same render. Nothing gets authored that
  email can't show.
- **Don't build admin UIs until the file workflow hurts.**
- **Every platform dependency sits behind a resolver or adapter** so swapping it
  is a file change, not a migration.

## Stack

| Concern | Choice | Notes |
|---|---|---|
| App | Next.js, TypeScript | Site, preview, send command, webhooks |
| Hosting | Vercel | Free tier. Portable if that changes. |
| Database | Supabase Postgres | Subscribers, sends log, tracking events. Nothing else. |
| Email relay | Resend — **decided 2026-09-19** | Delivery + open/click tracking + webhooks only. Postmark and SES were the alternatives; both rejected for the first issue because new accounts need manual approval (days). Resend delivers via its own MTA (`*.rmta.net`), *not* SES — so this is a bet on Resend specifically. Kept behind an adapter so it stays a config value. |
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
- **Pills** — freeform strings on any card or track ("rage", "acoustic",
  "twangy"). A *property*, not a block; pills never stand on their own.

There is **one card type, not two**: non-music entries (documentary, book, show)
are the same shape as an album, so they are the same block with a different
`kind`. The resolver record already carries `kind`; splitting them again is a
file change if that ever stops holding.
- **Divider**, **PullQuote**, **Image**, **PlaylistLink** as needed.

Every block type has exactly one renderer, the email one, and the site
renders it inline. Adding a block type is adding a component to that one file.
**Decided 2026-09-21**; until then there was a second, richer web renderer,
dropped because the site is now an inbox and the point of the reading pane is
to show what was actually sent.

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
2. `next dev` shows the issue at its URL, in the reading pane, exactly as it
   will land in the inbox. The raw email document is at `/issues/<slug>/email`.
3. A dev-only **components gallery** route renders every block with sample
   data. This is the design surface and the email regression check.
4. Later, if typing tags gets annoying: Keystatic (git-backed block editor,
   writes the same files). Not before.

## Design

Direction read from the logo (blocky extruded orange letters on navy):

- **Cream page background** (sample exact value from the reference file).
- **Navy app bar** on the site, slim, logo left and Subscribe right. The
  letter itself carries the big navy banner at its top and the navy footer
  with reply and unsubscribe at its bottom, so the site has no footer of its
  own — two navy footers stacked was the alternative.
- **Navy body text**, not black.
- **Orange is scarce**: pills, links, section-title accents.
- **Heavy condensed display face** for section titles; readable serif or plain
  sans for prose. Must look intentional when it degrades to system fonts.
- **Cover art carries the color.** Everything else stays restrained.
- **Texture** only on the site header and logo, never in email components.
- **Dark mode handled explicitly**: `color-scheme` meta, tested on iPhone
  Apple Mail and Gmail in dark mode before the first send.

Design happens in code, in the components gallery. No Figma step.

**The website is an inbox — decided 2026-09-21.** One layout for every public
page: a list of issues as message rows (sender, subject, preview line, date)
beside a reading pane showing the selected issue. The pane shows the actual
email render inline, not a web re-layout, so loading the homepage is the
preview. Wide screens show both halves scrolling independently; a phone shows
the list or the open message. Not a Gmail imitation: it uses the cream, navy,
and orange system and none of anyone else's chrome. The one permitted
difference from the inbox is type: the letter's named font stacks are mapped
to the loaded webfonts in `globals.css`, because a mail client only has system
fonts and the site does not have to pretend otherwise.

Colour and type tokens live in `src/design/tokens.ts` as literal strings, because
email HTML carries inline styles and cannot read CSS custom properties. Tailwind
restates them in `globals.css`; `npm run tokens:check` fails if the two drift.

Logo: needs the real file, plus a transparent-background PNG at 2x display size,
hosted on our domain for the email header.

## Publishing

**The send command does not render the email itself.** The app exposes the
email render at `/issues/<slug>/email` (and `?text=1` for the plain-text
alternative); `npm run send` fetches that and hands it to the relay. A route
handler cannot share a path with a page, so this is a child route rather than
the `?format=email` query param originally sketched. One compilation path, so what
the site shows is literally what gets sent rather than a parallel implementation that drifts.
Decided 2026-09-19; the alternative was compiling MDX separately in the script.

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

- Click and open tracking run through **`links.awomd.com`** (CNAME to
  `links2.resend-dns.com`), so tracked links carry our domain rather than the
  relay's — better looking, and a mismatched link domain is a spam signal.
- Relay-provided open and click tracking, toggled on. We store the webhook
  events raw and never build the pixel or redirect ourselves.
- Opens overcount (Apple Mail preloads). Treat opens as a floor, clicks as
  signal.
- Listen links carry `?i=<issue>&b=<block>` so link identity is ours regardless
  of relay.

## Website

All three are the inbox layout with a different message open:

- `/` — the latest issue open. On a phone, the message itself.
- `/issues` — the inbox. On a phone, the list; on a wide screen the latest
  issue is open beside it, since an empty pane helps nobody.
- `/issues/[slug]` — permalink, also the "read in browser" target.
- Subscribe is a `mailto:` button in the app bar until the form exists.
- `/about`
- `/subscribe/confirm`, `/unsubscribe` — token endpoints.
- `/dev/components` — gallery, dev only.

## Build order for the first issue

1. Repo: Next.js + TypeScript + Tailwind, Supabase client, React Email. Commit.
2. Issue file format and the block types: Prose, AlbumCard, Track, MediaCard,
   Pills.
3. Spotify resolver + JSON cache + cover mirroring.
4. Components gallery route. Establish the cream/navy/orange system there.
5. Email renderers for every block. Dark mode handling.
6. Site pages: home, archive, permalink, about.
7. ~~DNS~~ — **done 2026-09-19**, moved first in practice because it was the
   only step with lead time we don't control. Resend verified on `awomd.com`
   (DKIM + the `rsend`/`send` CNAMEs), DMARC `p=none` on the root, tracking
   subdomain `links.awomd.com`, email forwarding intact on the root MX. Note
   Resend's "Enable Receiving" stays **off** — turning it on would put MX on the
   root and break reply forwarding. Still outstanding: point root/www at Vercel,
   which needs the Vercel project to exist first.
8. Supabase schema. Subscribe form, confirm, unsubscribe, List-Unsubscribe.
9. Send command with self-send and idempotent list send.
10. Relay webhooks → events table.
11. Write the first issue. Self-send. Test on phone in light and dark. Send.

## Standing in for deferred pieces

Built for the first issue under the 2026-09-20 descope. Each is a deliberate
stand-in with the same guarantee as the real thing, not a shortcut:

- **Recipients** are a gitignored `content/recipients.txt`, not a database.
  Real addresses never enter version control.
- **Idempotency** is a `.sends/<issue>.jsonl` ledger instead of the `sends`
  table. Same property: nobody gets an issue twice, and a half-failed run
  resumes on re-run.
- **Unsubscribe** is `mailto:`-based, because per-recipient tokens need the
  subscribers table. Gmail and Apple Mail still show a one-click button; they
  send mail instead of POSTing. Swap to a tokenised HTTPS URL plus
  `List-Unsubscribe-Post` when Supabase lands.
- **Subscribe** is a `mailto:` button in the app bar, for the same reason:
  no subscribers table means no form to post to yet. Requests arrive as email
  and go on the recipients file by hand.
- **Cards are hand-entered** (artist, title, year, cover) rather than resolved.
  `ResolvedRecord` already has the shape the resolver will fill, so the change
  is how a card is populated, not how it renders.

## Gotcha

Turbopack's build cache can miss an edit to an MDX file — the build succeeds and
serves the previous compilation. If a change to an issue does not appear, `rm -rf
.next` and rebuild. Cost an hour once; worth the line.

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
