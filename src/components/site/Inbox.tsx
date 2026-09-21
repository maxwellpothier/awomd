import Link from "next/link";
import type { ReactNode } from "react";
import { Letter } from "@/components/site/Letter";
import {
  SubscribeLetter,
  type SubscribeState,
} from "@/components/site/SubscribeLetter";
import {
  issueDateLabel,
  issues,
  latestIssue,
  type IssueMeta,
} from "@/content/issues";
import { site, subscribeMessage } from "@/content/site";

/**
 * What the reading pane shows: an issue, or the pinned subscribe message.
 * Undefined leaves the pane empty.
 */
export type Open =
  | { kind: "issue"; meta: IssueMeta }
  | { kind: "subscribe"; state: SubscribeState };

/**
 * The site is an inbox.
 *
 * Every public page is this one layout: a list of messages, and a reading
 * pane showing the open one. The first row is always the subscribe message,
 * so the inbox is never empty and `/subscribe` is a message like any other.
 * Below it, issues, newest first, each rendered exactly as it was emailed.
 *
 * On a wide screen both halves are visible and scroll independently, like a
 * mail client. On a phone the page is either the list or the open message,
 * which is what `view` decides.
 */
export function Inbox({ open, view }: { open?: Open; view: "list" | "message" }) {
  const count = issues.length + 1;
  return (
    <div className="lg:flex lg:h-[calc(100dvh-var(--header-h))]">
      <aside
        aria-label="Messages"
        className={`${
          view === "message" ? "hidden lg:flex" : "flex"
        } flex-col border-cream-deep bg-cream lg:w-[340px] lg:flex-none lg:overflow-y-auto lg:border-r xl:w-[380px]`}
      >
        <div className="flex items-baseline justify-between px-5 pb-3 pt-6">
          <h1 className="font-display text-2xl uppercase leading-none tracking-[0.04em]">
            Inbox
          </h1>
          <span className="font-display text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            {count} {count === 1 ? "message" : "messages"}
          </span>
        </div>
        <ol className="border-t border-cream-deep">
          <Row
            href={subscribeMessage.path}
            selected={open?.kind === "subscribe"}
            corner={<Pinned />}
            subject={subscribeMessage.subject}
            preview={subscribeMessage.preview}
            tag="Subscribe"
          />
          {issues.map((issue) => (
            <Row
              key={issue.slug}
              href={`/issues/${issue.slug}`}
              selected={open?.kind === "issue" && open.meta.slug === issue.slug}
              corner={
                <time
                  dateTime={issue.date}
                  className="flex-none text-xs tabular-nums text-ink-muted"
                >
                  {shortDate(issue.date)}
                </time>
              }
              dot={issue.slug === latestIssue?.slug}
              subject={issue.title}
              preview={issue.preview}
              tag={`Issue ${issue.number}`}
            />
          ))}
        </ol>
      </aside>

      <section
        aria-label="Reading pane"
        className={`${
          view === "list" ? "hidden lg:block" : "block"
        } min-w-0 flex-1 bg-cream-deep lg:overflow-y-auto`}
      >
        {open?.kind === "issue" ? <IssueMessage meta={open.meta} /> : null}
        {open?.kind === "subscribe" ? <SubscribeMessage state={open.state} /> : null}
        {!open ? <EmptyPane /> : null}
      </section>
    </div>
  );
}

function Row({
  href,
  selected,
  corner,
  dot = false,
  subject,
  preview,
  tag,
}: {
  href: string;
  selected: boolean;
  /** Top-right of the row: a date for issues, a pin for the subscribe message. */
  corner: ReactNode;
  /** Orange dot before the subject, marking the latest issue. */
  dot?: boolean;
  subject: string;
  preview: string;
  /** Bottom label: "Issue 001" or "Subscribe". */
  tag: string;
}) {
  return (
    <li className="border-b border-cream-deep">
      <Link
        href={href}
        aria-current={selected ? "page" : undefined}
        className={`block border-l-[3px] px-5 py-4 transition-colors ${
          selected
            ? "border-orange bg-cream-deep"
            : "border-transparent hover:bg-cream-deep/60"
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate font-display text-[11px] uppercase tracking-[0.2em] text-ink-muted">
            {site.name}
          </span>
          {corner}
        </div>
        <p className="mt-1.5 flex items-start gap-2 font-display text-lg uppercase leading-tight tracking-[0.01em]">
          {dot ? (
            <span
              className="mt-[0.45em] h-2 w-2 flex-none rounded-full bg-orange"
              aria-label="Latest"
            />
          ) : null}
          <span>{subject}</span>
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink-muted">
          {preview}
        </p>
        <p className="mt-2 font-display text-[11px] uppercase tracking-[0.18em] text-orange-deep">
          {tag}
        </p>
      </Link>
    </li>
  );
}

function Pinned() {
  return (
    <span className="flex flex-none items-center gap-1 font-display text-[11px] uppercase tracking-[0.18em] text-orange-deep">
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="h-3 w-3 fill-current"
      >
        <path d="M9.5 1.5 14.5 6.5l-2.2.4-2.6 2.6.4 3.5-1.4 1.4L6 11.7 2.5 15.2l-1.7-1.7L4.3 10 1.6 7.3 3 5.9l3.5.4 2.6-2.6z" />
      </svg>
      Pinned
    </span>
  );
}

/** The mail-client header above a message: subject, sender, date, reply. */
function MessageHeader({
  subject,
  suffix,
  dateLine,
  replySubject,
}: {
  subject: string;
  suffix?: string;
  dateLine: string;
  replySubject: string;
}) {
  return (
    <header className="mb-6">
      <p className="mb-5 lg:hidden">
        <Link
          href="/issues"
          className="font-display text-[11px] uppercase tracking-[0.2em] text-ink-muted hover:text-orange"
        >
          ← Inbox
        </Link>
      </p>
      <h1 className="font-display text-2xl uppercase leading-tight tracking-[0.01em] sm:text-3xl">
        {subject}
        {suffix ? <span className="text-ink-muted"> · {suffix}</span> : null}
      </h1>
      <div className="mt-5 flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-navy font-display text-xl text-orange"
        >
          A
        </span>
        <div className="min-w-0 text-sm leading-5">
          <p className="truncate">
            <span className="font-semibold">{site.name}</span>{" "}
            <span className="text-ink-muted">&lt;{site.replyAddress}&gt;</span>
          </p>
          <p className="text-ink-muted">to you · {dateLine}</p>
        </div>
        <a
          href={`mailto:${site.replyAddress}?subject=${encodeURIComponent(replySubject)}`}
          className="ml-auto flex-none font-display text-[11px] uppercase tracking-[0.18em] text-orange-deep hover:text-orange"
        >
          Reply
        </a>
      </div>
    </header>
  );
}

function IssueMessage({ meta }: { meta: IssueMeta }) {
  return (
    <article className="mx-auto max-w-[600px] px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
      <MessageHeader
        subject={meta.title}
        suffix={`Issue ${meta.number}`}
        dateLine={`${issueDateLabel(meta.date)}, ${site.sendTime}`}
        replySubject={`Re: ${meta.title}`}
      />
      <Letter meta={meta} />
    </article>
  );
}

function SubscribeMessage({ state }: { state: SubscribeState }) {
  return (
    <article className="mx-auto max-w-[600px] px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
      <MessageHeader
        subject={subscribeMessage.subject}
        dateLine="whenever you get to it"
        replySubject="Subscribe"
      />
      <SubscribeLetter state={state} />
    </article>
  );
}

function EmptyPane() {
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center px-6 text-center">
      <div>
        <p className="font-display text-2xl uppercase leading-none tracking-[0.04em] text-ink-muted">
          Nothing open
        </p>
        <p className="mt-3 text-sm text-ink-muted">Select a message to read it.</p>
      </div>
    </div>
  );
}

/** "Sep 20" in the list, the way every mail client abbreviates it. */
function shortDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
