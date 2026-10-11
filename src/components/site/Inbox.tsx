import Link from "next/link";
import type { ReactNode } from "react";
import { Letter } from "@/components/site/Letter";
import {
  issueDateLabel,
  issues,
  latestIssue,
  type IssueMeta,
} from "@/content/issues";
import { site } from "@/content/site";

/**
 * The inbox.
 *
 * Issues as message rows, newest first, beside a reading pane showing the
 * open one exactly as it was emailed. On a wide screen both halves are
 * visible and scroll independently, like a mail client. On a phone the page
 * is either the list or the open message, which is what `view` decides.
 * Before the first send, both halves say the inbox is empty.
 */
export function Inbox({
  open,
  view,
}: {
  /** The open issue. Undefined leaves the pane empty. */
  open?: IssueMeta;
  view: "list" | "message";
}) {
  const count = issues.length;
  return (
    <div className="lg:flex lg:h-[calc(100dvh-var(--header-h))]">
      <aside
        aria-label="Messages"
        className={`${
          view === "message" ? "hidden lg:flex" : "flex"
        } flex-col border-cream-deep bg-cream lg:w-[340px] lg:flex-none lg:overflow-y-auto lg:border-r xl:w-[380px]`}
      >
        <div className="flex items-baseline justify-between px-5 pb-4 pt-6">
          <h1 className="text-[22px] font-semibold leading-none">Inbox</h1>
          {count > 0 ? (
            <span className="text-sm text-ink-muted">
              {count} {count === 1 ? "issue" : "issues"}
            </span>
          ) : null}
        </div>
        {count === 0 ? (
          <p className="border-t border-cream-deep px-5 py-8 text-[15px] text-ink-muted">
            No issues yet.
          </p>
        ) : null}
        <ol className="border-t border-cream-deep">
          {issues.map((issue) => (
            <Row
              key={issue.slug}
              href={`/issues/${issue.slug}`}
              selected={open?.slug === issue.slug}
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
        {open ? <IssueMessage meta={open} /> : <EmptyPane />}
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
}: {
  href: string;
  selected: boolean;
  /** Top-right of the row: the date. */
  corner: ReactNode;
  /** Orange dot before the subject, marking the latest issue. */
  dot?: boolean;
  subject: string;
  preview: string;
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
          <span className="flex min-w-0 items-center gap-2 text-[15px] font-semibold">
            {dot ? (
              <span
                className="h-2 w-2 flex-none rounded-full bg-orange"
                aria-label="Latest"
              />
            ) : null}
            <span className="truncate">{site.name}</span>
          </span>
          {corner}
        </div>
        <p className="mt-0.5 truncate text-[15px]">{subject}</p>
        <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-ink-muted">
          {preview}
        </p>
      </Link>
    </li>
  );
}

const headerButton =
  "rounded-[3px] border border-ink/20 px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-navy hover:bg-navy hover:text-cream";

/** The mail-client header above a message: subject, sender, date, reply, share. */
function MessageHeader({
  subject,
  suffix,
  dateLine,
  replySubject,
  shareHref,
}: {
  subject: string;
  suffix?: string;
  dateLine: string;
  replySubject: string;
  /** The issue's story images. */
  shareHref?: string;
}) {
  return (
    <header className="mb-6">
      <p className="mb-5 lg:hidden">
        <Link
          href="/issues"
          className="text-[15px] text-ink-muted transition-colors hover:text-ink"
        >
          ← All issues
        </Link>
      </p>
      <h1 className="text-[24px] font-semibold leading-tight sm:text-[26px]">
        {subject}
        {suffix ? (
          // Wraps as one piece, never leaving "001" alone on a line.
          <span className="whitespace-nowrap font-normal text-ink-muted">
            {" "}
            · {suffix}
          </span>
        ) : null}
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
        <div className="ml-auto flex flex-none gap-2">
          <a
            href={`mailto:${site.replyAddress}?subject=${encodeURIComponent(replySubject)}`}
            className={headerButton}
          >
            Reply
          </a>
          {shareHref ? (
            <Link href={shareHref} className={headerButton}>
              Share
            </Link>
          ) : null}
        </div>
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
        dateLine={issueDateLabel(meta.date)}
        replySubject={`Re: ${meta.title}`}
        shareHref={`/issues/${meta.slug}/share`}
      />
      <Letter meta={meta} />
    </article>
  );
}

/**
 * Two empty states. Before the first send there is nothing to select, and
 * the pane says so and when that changes. After it, an empty pane only means
 * nothing is open yet.
 */
function EmptyPane() {
  const empty = issues.length === 0;
  return (
    <div className="flex h-full min-h-[50vh] items-center justify-center px-6 text-center">
      <div>
        <p className="text-[22px] font-semibold">
          {empty ? "No issues yet" : "Nothing open"}
        </p>
        <p className="mt-2 text-[15px] text-ink-muted">
          {empty
            ? "The first one goes out on a Sunday evening."
            : "Pick an issue to read it."}
        </p>
        {empty ? (
          <Link
            href="/"
            className="mt-6 inline-block rounded-[3px] bg-navy px-5 py-2.5 text-[15px] font-medium text-cream transition-colors hover:bg-navy-soft"
          >
            Subscribe
          </Link>
        ) : null}
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
