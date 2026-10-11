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

First issue: Sunday 2026-09-27, 4pm. Quality over speed; ship when it's right.

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
- **Track** — title, artist, cover, pills, listen link, and a short note
  written as children, so it can hold links (2026-09-27, was a `note` string).
  Standalone or nested under an AlbumCard.
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
- **Orange is scarce**: section-title accents.
- **Pills are coloured chips** (2026-09-27, replacing orange text joined by
  dots): rounded, soft tints with navy text, the tint picked from the pill's
  text so a genre keeps its colour across issues. The one place besides cover
  art that adds colour.
- **Links in the letter's prose are default blue** (`#0000ee`, underlined;
  chosen by Max 2026-09-27), so they read as links at a glance.
- **Installed fonts only, site and email alike** (chosen by Max 2026-09-26):
  Avenir Next Condensed Heavy for headlines, Georgia for everything else.
  Gmail and Outlook ignore webfonts, so a loaded face would only ever reach
  Apple Mail readers. Each stack falls back to something close; who sees what
  is in `docs/email-safe-fonts.md`. A custom face could come back later only as
  images of the headlines.
- **Cover art carries the color.** Everything else stays restrained.
- **Texture** only on the site header and logo, never in email components.
- **Torn paper** (2026-09-26): the homepage masthead and the email banner end
  in the same tear (`src/design/tear.ts`). The site clips to it; email can't
  clip, so it is baked into `public/brand/email-banner.png` over transparency
  (`npm run banner`), which replaced the orange rule under the banner.
  Later the same day the letter picked the tear up twice more, both as
  images over transparency: `<Divider tear />` is the sheet above torn and
  laid over the next, full width, for the big turns in an issue
  (`npm run divider`); the footer is a navy sheet torn along its top and laid
  on the letter (`npm run footer`). A full-width tear needs the gutters off
  the letter, so the MDX `wrapper` pads the body and cuts it into sheets at
  each tear. The footer carries the sign-off ("That's the desk this week…"),
  an outlined Unsubscribe button, Share on your story and Read in browser,
  and "Forwarded this? Get it every Sunday at awomd.com" (the last two added
  2026-10-09; see Spreading the word).
- **Dark mode handled explicitly**: `color-scheme` meta, tested on iPhone
  Apple Mail and Gmail in dark mode before the first send.

Design happens in code, in the components gallery. No Figma step.

**Site chrome pass — 2026-09-26.** The first version read as generated: a
tracked-caps eyebrow, a caps headline, an orange bar and a paragraph on every
page, orange on every control, copy full of em dashes and slogans. Now: the
display face appears once per page, as the H1; everything else, nav and
buttons included, is in sentence case, set in Georgia (see type,
above); no eyebrows or accent bars;
primary buttons are navy, and orange is left to the header's Subscribe and the
logo. No orange rule under the bar. Copy is first person and plain, in the voice
of the issues. The homepage shows the latest issue beside the form, as a sheet of paper on
the desk: askew, torn along the bottom, with three of its covers (the issue's
`covers`, picked for colour) tucked under it; "Past issues" labels it on a
phone, where it falls below the form.
Since 2026-10-05 the sheet is the top of a pile: up to four earlier issues
lie under it, each a smaller torn sheet at its own angle showing its number,
title and first cover, and past four the pile ends in a link to `/issues`.
Before that the homepage showed only the latest, so each new issue made the
last one disappear from it.
The letter's own blocks were not part of this pass.

**The website is an inbox — decided 2026-09-21.** One layout for every public
page: a list of issues as message rows (sender, subject, preview line, date)
beside a reading pane showing the selected issue. The pane shows the actual
email render inline, not a web re-layout, so loading the homepage is the
preview. Wide screens show both halves scrolling independently; a phone shows
the list or the open message. Not a Gmail imitation: it uses the cream, navy,
and orange system and none of anyone else's chrome. Since the fonts are
installed ones, the site draws the letter exactly as the inbox does, type
included.

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

**Merging a new issue into main sends it — decided 2026-09-27**, replacing
"a command, not cron, not a button". `.github/workflows/send-issue.yml` runs on
a push to main that adds an entry to `src/content/issues.ts`, waits for the
issue to answer at awomd.com (Vercel has deployed it), and sends it to every
confirmed subscriber. Registering an issue publishes it and sends it; editing
one already registered sends nothing. Sent as soon as it is live, so the merge
time is the send time: merge at 4pm Sunday. GitHub Actions holds the relay and
Supabase keys as repository secrets. It only runs while the repository
variable `AUTO_SEND` is `true`; issue 001 went out by hand, merged first so
its images and unsubscribe links were live before anyone opened it.

The command is still there, for self-sends and for finishing by hand:

```
npm run send -- --issue 2026-09-27 --to me      # renders, sends to Max only, records nothing
npm run send -- --issue 2026-09-27 --to list    # what the workflow runs
```

- Self-send is a required first step, and stays by hand: Max asks for one
  before merging, and reads it on a phone in Gmail and Apple Mail.
- The `sends` table makes it idempotent: a recipient can't get the same issue
  twice, and a half-failed send resumes (re-run the job). Each row is claimed
  before its email goes, so two runs at once can't double-send.
- Every email carries `List-Unsubscribe` and `List-Unsubscribe-Post` headers
  for one-click unsubscribe in Gmail/Apple Mail.
- Footer unsubscribe link works on first click, no login, no confirmation page.
- Physical mailing address in the footer is **deferred** (Max is arranging one).

## Subscribers

- **Double opt-in.** Form → confirmation email → confirm link → subscribed.
- Subscribe form ships with the site; the first send can go to a hand-made list.
- Each confirm emails Max at the reply address ("New subscriber: …", with the
  running count, and since 2026-10-09 the `?ref` they came in on). Bounces
  and spam complaints email him too (2026-10-09), and so do unsubscribes and
  undos (2026-10-09), because a forwarded copy's button or a mail scanner
  can take a reader off without their meaning to. On confirm rather than
  signup, so typos and no-shows stay quiet. Added 2026-09-27.
- **Confirming sends the latest issue — decided 2026-10-09.** Nobody who signs
  up on a Monday waits six days to see what they signed up for: the confirm
  link sends the latest issue straight away (`email/welcome.ts`), subject
  "Welcome to A Week on My Desk", with a short note from Max above the banner.
  The note carries the Promotions-to-Primary ask, moved out of the
  confirmation email because this is the first issue a reader can drag, and
  asks for a reply with one album they love (replies help the next issue
  land in Primary). It is a real send: claimed in `sends` first, so the
  Sunday send skips them and a bounce on it is matched. Preview it at
  `/issues/<slug>/email?welcome=1`.
- **`source`** is `site` for the form, `site:<ref>` when the visitor first
  arrived on a `?ref=` link (`awomd.com/?ref=randys`), or `hand-added`. The
  proxy (`src/proxy.ts`) keeps the first ref in a cookie for 30 days, so a
  signup a few pages later still counts.
- Tables: `subscribers` (email, status, tokens, timestamps), `sends`
  (subscriber, issue, sent_at, relay message id), `events` (subscriber, issue,
  type, link, timestamp — raw relay webhook events).

## Tracking

Track as much as possible now; scale down later.

**Open and click tracking go off — decided 2026-10-05**, to keep the letter
out of Gmail's Promotions tab: click tracking rewrote all 30 to 40 links in an
issue into redirects and open tracking added a pixel, and no personal email has
either. Unproven, so it is being tested against fresh Gmail seed accounts.
Replies are the signal now. The setting is on the domain in Resend
(Configuration); the notes below describe what is there to turn back on.
The subject lost its `· Issue 002` the same day, for the same reason: it is
the issue's title alone.

- Click and open tracking run through **`links.awomd.com`** (CNAME to
  `links2.resend-dns.com`), so tracked links carry our domain rather than the
  relay's — better looking, and a mismatched link domain is a spam signal.
- Relay-provided open and click tracking, toggled on. We store the webhook
  events raw and never build the pixel or redirect ourselves.
- Opens overcount (Apple Mail preloads). Treat opens as a floor, clicks as
  signal.
- Listen links carry `?i=<issue>&b=<block>` so link identity is ours regardless
  of relay.

## Spreading the word

Decided 2026-10-09, from a growth plan: before handing the link to anyone
new, make sure every way it travels turns into a signup.

- **Link previews.** A link to the site or an issue unfurls (iMessage,
  Slack, Instagram DMs) as a card: the title on a torn sheet beside the
  covers.
- **Forwards.** The footer says "Forwarded this? Get it every Sunday at
  awomd.com". The forwarded copy's Unsubscribe button is still the
  forwarder's, so `/unsubscribe` names the address it took off (partly
  hidden) and tells a friend who wasn't them how to put them back.
- **Story images.** For each issue, one 1080 × 1920 image of the whole issue
  and one per record, so a reader can post the issue or just the album that
  got them. Instagram can't take a link along with an image, so Share copies
  the issue's link (`?ref=story`) for a link sticker.
- **The confirmed page** asks "Know someone who'd like it too?" with a share
  button (`?ref=share`).
- **Attribution.** Every outside link carries a `?ref` (`ig`, `randys`,
  `story`, `forward`, `rss`…), which lands in `source`.
- The images can't use the letter's installed fonts, so they draw in Roboto
  Condensed ExtraBold (what Android shows for the headline stack) and Gelasio
  (drawn to Georgia's metrics); see `assets/fonts/`.

## Website

- `/` — the **signup page**: eyebrow, headline, one paragraph, the email
  field, and nothing competing with it. This is the link to hand around.
  `?sent=1` and `?confirmed=1` show the later steps of double opt-in.
- `/issues` — the inbox. On a phone, the list; on a wide screen the latest
  issue is open beside it. Empty until the first issue goes out, and says so,
  with a Subscribe button back to `/`.
- `/issues/[slug]` — permalink, also the "read in browser" target.
- `/issues/[slug]/share` — "Share on your story": the issue's story images
  to pick from, each with a Share button (phones) or Download (desktop).
  Linked from the letter's footer and the inbox's Share button.
- `/issues/[slug]/story/[block]` — the story images themselves, made at build
  time. `issue` for the whole issue, or a record's block id.
- `/about`
- `/subscribe/confirm`, `/unsubscribe` — token endpoints, with step 8.
- `/dev/components` — gallery, dev only.
- `/feed.xml` (RSS), `/sitemap.xml`, `/robots.txt`; every page has a link
  preview image (`opengraph-image.tsx`, the site's and one per issue).

**Signup is its own page, not part of the inbox — decided 2026-09-21.** For
about an hour the signup was a message pinned to the top of the inbox, open by
default on `/`. Reversed the same day: Max wanted to start handing the link
out and an inbox is an unfamiliar first screen for someone who doesn't know
what this is, with the field below a banner and a pitch on a laptop. The
signup page puts the field in the first screen everywhere. The inbox keeps its
identity at `/issues`.

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
   **Schema done 2026-09-23**: `subscribers`, `sends`, `events` are live, RLS
   on with no policies, `anon`/`authenticated` granted nothing. With
   "Automatically expose new tables" off, `service_role` gets no table
   privileges either — bypassing RLS is not the same as being granted access —
   so a third migration grants it read/write explicitly. Any new table needs
   the same grant. **Subscribe and confirm done 2026-09-23**: `/api/subscribe`
   records a pending row and emails a confirm link; `/subscribe/confirm`
   moves pending to confirmed. **Tokenised unsubscribe, and the send reading
   from `subscribers`, done 2026-09-27.**
9. Send command with self-send and idempotent list send.
10. Relay webhooks → events table. **Done 2026-10-09**: Resend posts every
    event to `/api/webhooks/relay`, signed with `RESEND_WEBHOOK_SECRET`, and
    each lands raw in `events`, matched to its subscriber and issue by the
    `sends.message_id`, or by address for mail that isn't an issue. A
    permanent bounce (or Resend suppressing the address) marks the subscriber
    `bounced`; a spam complaint unsubscribes them, since the address works and
    they can come back. Either emails Max. Soft bounces, opens and clicks are
    recorded and change nothing.
11. Write the first issue. Self-send. Test on phone in light and dark. Send.

## Standing in for deferred pieces

Built for the first issue under the 2026-09-20 descope. Each is a deliberate
stand-in with the same guarantee as the real thing, not a shortcut:

- ~~**Recipients** are a gitignored `content/recipients.txt`; **idempotency**
  is a `.sends/<issue>.jsonl` ledger~~ — **retired 2026-09-27.** The send reads
  confirmed rows from `subscribers` and records to `sends`. Both hand-listed
  addresses were already confirmed there.
- ~~**Unsubscribe** is `mailto:`-based~~ — **real since 2026-09-27.** The
  send gives every recipient a `subscribers` row (hand-listed addresses are
  added as confirmed, `source = 'hand-added'`), skips anyone unsubscribed or
  bounced, and renders each email with that reader's token. The footer button
  and the `List-Unsubscribe` header (plus `List-Unsubscribe-Post`) both hit
  `/api/unsubscribe?token=`: GET from the button, off on the first click, then
  `/unsubscribe` offers an undo, which also covers mail scanners following
  links; POST from the inbox's own one-click button. The header keeps a
  mailto alongside.
- ~~**Nothing rate-limits confirmation emails.**~~ — **throttled 2026-10-09**,
  before the link goes anywhere public: one confirmation email per address
  per ten minutes (`confirm_sent_at`), and a hidden field that only bots fill
  in. Still nothing per IP; add it if a flood of distinct addresses ever
  comes through.
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
- **Send from CI on merge** — raised 2026-09-21, parked. Merging an issue
  branch to `main` should deploy it, not send it: email is irreversible, a
  merge is low-ceremony, the ledger is a local file that a fresh runner
  would not have, and CI would race the Vercel deploy for the covers. The
  shape to revisit once the `sends` table exists: a manually triggered
  GitHub Actions workflow that takes an issue slug, self-sends, then pauses
  on an environment approval gate for the phone check before the list
  send. A Sunday 4pm scheduled job that sends whatever is registered and
  unsent is a small addition on top of that.
- **Kid-safety highlights** — raised 2026-09-27 during issue 001, parked for
  a later issue. Song and album names get a highlighter swipe like the
  homepage headline: none means safe to play in front of Max's kids, yellow
  means cautious, red means wouldn't. A disclaimer at the very top of the
  letter explains the key. Email can't use the homepage's data-URI SVG
  (Gmail blocks data URIs), so the band would be a hosted PNG per colour as
  a `background-image`. Per caniemail: fine in Apple Mail, Gmail (web, and
  the apps with a Google account), Outlook.com and new Outlook, Yahoo,
  Samsung; missing in classic Outlook and Windows Mail, and missized in
  Gmail's mobile web and with non-Google accounts. Where it fails nothing
  shows, so a flagged song reads as safe; consider a small text marker as
  well. Check Gmail's forced dark mode, which lightens text but not the band.
  The pills keep their butter and rose tints (Max's call).
- **Windows and classic Outlook headline fonts** — parked 2026-09-27. Readers
  there get whatever the stack gives them, and that's accepted for now. Two
  gaps to revisit: classic Outlook may drop to Times New Roman because the
  first font in the headline stack isn't installed (untested; the fix is an
  `<!--[if mso]>` style naming Arial Narrow, Arial), and Windows without
  Office has no Arial Narrow, so headlines fall to plain Arial Bold (Impact or
  Bahnschrift would keep them condensed; see `docs/email-safe-fonts.md`).
- Analytics dashboard (queries on `events` suffice)
- Custom domain for the components gallery or any auth
