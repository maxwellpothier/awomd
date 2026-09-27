-- A Week on My Desk — initial schema.
--
-- PLAN.md: "Own the content and the list. Rent delivery." Issues live in git;
-- this file is everything that cannot. Three tables, nothing else.
--
-- Access model: the browser never talks to Postgres. The subscribe form posts
-- to a route handler, and every write here runs server-side under the service
-- role. So `anon` and `authenticated` are granted nothing at all, and RLS is on
-- with no policies — a deny-all that the service role bypasses by design.
-- If a key ever leaks into client JS, it reads nothing.

-- gen_random_bytes / gen_random_uuid for tokens and ids; citext for
-- case-insensitive email equality.
create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- subscribers
-- ---------------------------------------------------------------------------

-- Double opt-in, as a state machine: pending -> confirmed -> unsubscribed.
-- 'bounced' is terminal and set from relay webhooks, so a dead address stops
-- being retried on every send.
create type subscriber_status as enum (
  'pending',
  'confirmed',
  'unsubscribed',
  'bounced'
);

create table subscribers (
  id uuid primary key default gen_random_uuid(),

  -- Case-insensitive and unique. Gmail treats Max@ and max@ as one mailbox and
  -- so must we, or the same person lands on the list twice and gets two copies.
  email citext not null unique,

  status subscriber_status not null default 'pending',

  -- Opaque, unguessable, and stored rather than signed — PLAN calls for tokens
  -- on the row. Stored means they can be rotated or revoked per subscriber
  -- without invalidating everyone's links at once.
  confirm_token text not null default encode(gen_random_bytes(32), 'hex'),
  unsubscribe_token text not null default encode(gen_random_bytes(32), 'hex'),

  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,

  -- Free-text note about where someone came from ('site', 'hand-added').
  source text
);

-- Tokens arrive as a URL parameter and are looked up on every click.
create unique index subscribers_confirm_token_idx on subscribers (confirm_token);
create unique index subscribers_unsubscribe_token_idx on subscribers (unsubscribe_token);

-- The send command's only read: who gets this issue.
create index subscribers_status_idx on subscribers (status);

-- ---------------------------------------------------------------------------
-- sends
-- ---------------------------------------------------------------------------

-- The idempotency ledger, replacing .sends/<issue>.jsonl. Same guarantee,
-- enforced by the database instead of by a file: the unique constraint makes a
-- duplicate send impossible even if two runs overlap, which the file could not.
create table sends (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references subscribers (id) on delete cascade,

  -- The issue slug, e.g. '2026-09-20'. Deliberately not a foreign key: issues
  -- live in git, not in this database, and the schema should not pretend
  -- otherwise.
  issue text not null,

  sent_at timestamptz not null default now(),

  -- The relay's id, so a delivery can be traced back to Resend later.
  message_id text,

  unique (subscriber_id, issue)
);

create index sends_issue_idx on sends (issue);

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------

-- Raw relay webhook events. PLAN: "store the webhook events raw and never build
-- the pixel or redirect ourselves." Opens overcount because Apple Mail and
-- Gmail prefetch images, so these are a floor, not a count of human reads.
create table events (
  id uuid primary key default gen_random_uuid(),

  -- Nullable: a webhook can arrive for an address that has since been deleted,
  -- and losing the event would be worse than an orphan row.
  subscriber_id uuid references subscribers (id) on delete set null,

  issue text,

  -- Relay vocabulary, kept as text rather than an enum so a new event type
  -- from Resend lands in the table instead of erroring the webhook.
  type text not null,

  -- For click events: which link was hit.
  link text,

  occurred_at timestamptz not null default now(),

  -- The relay's own id for this delivery. Resend retries webhooks, and a retry
  -- must not create a second row — this is what makes the insert idempotent.
  -- Nullable because a hand-inserted or backfilled row has no relay id, and
  -- Postgres lets multiple NULLs coexist under a unique constraint.
  relay_event_id text unique,

  -- The untouched webhook body, so nothing is lost to a parsing decision made
  -- before we knew what we wanted.
  payload jsonb
);

create index events_subscriber_idx on events (subscriber_id);
create index events_issue_type_idx on events (issue, type);

-- ---------------------------------------------------------------------------
-- Lock-down
-- ---------------------------------------------------------------------------

-- RLS on with zero policies: everything is denied to every API role. The
-- service role bypasses RLS, which is the only way this data is ever read.
alter table subscribers enable row level security;
alter table sends enable row level security;
alter table events enable row level security;

-- "Automatically expose new tables" was left off at project creation, so the
-- API roles hold no privileges here. Revoke explicitly anyway — this file
-- should state the access model rather than depend on a dashboard checkbox.
revoke all on subscribers from anon, authenticated;
revoke all on sends from anon, authenticated;
revoke all on events from anon, authenticated;
