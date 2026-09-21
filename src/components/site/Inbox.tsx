import Link from "next/link";
import { Letter } from "@/components/site/Letter";
import {
  issueDateLabel,
  issues,
  latestIssue,
  type IssueMeta,
} from "@/content/issues";
import { site } from "@/content/site";

/**
 * The site is an inbox.
 *
 * Every public page is this one layout: a list of issues as message rows,
 * and a reading pane showing the selected issue exactly as it was emailed.
 * On a wide screen both are visible and scroll independently, like a mail
 * client. On a phone the page is either the list or the open message,
 * which is what `view` decides.
 */
export function Inbox({
  selected,
  view,
}: {
  /** The open message. Undefined leaves the pane empty. */
  selected?: IssueMeta;
  /** Which half a narrow screen shows. Wide screens always show both. */
  view: "list" | "message";
}) {
  return (
    <div className="lg:flex lg:h-[calc(100dvh-var(--header-h))]">
      <aside
        aria-label="Issues"
        className={`${
          view === "message" ? "hidden lg:flex" : "flex"
        } flex-col border-cream-deep bg-cream lg:w-[340px] lg:flex-none lg:overflow-y-auto lg:border-r xl:w-[380px]`}
      >
        <div className="flex items-baseline justify-between px-5 pb-3 pt-6">
          <h1 className="font-display text-2xl uppercase leading-none tracking-[0.04em]">
            Inbox
          </h1>
          <span className="font-display text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            {issues.length} {issues.length === 1 ? "issue" : "issues"}
          </span>
        </div>
        {issues.length === 0 ? (
          <p className="border-t border-cream-deep px-5 py-10 text-center font-display text-[11px] uppercase tracking-[0.22em] text-ink-muted">
            No items in inbox
          </p>
        ) : (
          <ol className="border-t border-cream-deep">
            {issues.map((issue) => (
              <MessageRow
                key={issue.slug}
                issue={issue}
                selected={issue.slug === selected?.slug}
                latest={issue.slug === latestIssue?.slug}
              />
            ))}
          </ol>
        )}
      </aside>

      <section
        aria-label="Reading pane"
        className={`${
          view === "list" ? "hidden lg:block" : "block"
        } min-w-0 flex-1 bg-cream-deep lg:overflow-y-auto`}
      >
        {selected ? <Message meta={selected} /> : <EmptyPane />}
      </section>
    </div>
  );
}

function MessageRow({
  issue,
  selected,
  latest,
}: {
  issue: IssueMeta;
  selected: boolean;
  latest: boolean;
}) {
  return (
    <li className="border-b border-cream-deep">
      <Link
        href={`/issues/${issue.slug}`}
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
          <time
            dateTime={issue.date}
            className="flex-none text-xs tabular-nums text-ink-muted"
          >
            {shortDate(issue.date)}
          </time>
        </div>
        <p className="mt-1.5 flex items-start gap-2 font-display text-lg uppercase leading-tight tracking-[0.01em]">
          {latest ? (
            <span
              className="mt-[0.45em] h-2 w-2 flex-none rounded-full bg-orange"
              aria-label="Latest"
            />
          ) : null}
          <span>{issue.title}</span>
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink-muted">
          {issue.preview}
        </p>
        <p className="mt-2 font-display text-[11px] uppercase tracking-[0.18em] text-orange-deep">
          Issue {issue.number}
        </p>
      </Link>
    </li>
  );
}

function Message({ meta }: { meta: IssueMeta }) {
  return (
    <article className="mx-auto max-w-[600px] px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
      <p className="mb-5 lg:hidden">
        <Link
          href="/issues"
          className="font-display text-[11px] uppercase tracking-[0.2em] text-ink-muted hover:text-orange"
        >
          ← Inbox
        </Link>
      </p>

      <header className="mb-6">
        <h1 className="font-display text-2xl uppercase leading-tight tracking-[0.01em] sm:text-3xl">
          {meta.title}
          <span className="text-ink-muted"> · Issue {meta.number}</span>
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
            <p className="text-ink-muted">
              to you · {issueDateLabel(meta.date)}, {site.sendTime}
            </p>
          </div>
          <a
            href={`mailto:${site.replyAddress}?subject=Re: ${meta.title}`}
            className="ml-auto flex-none font-display text-[11px] uppercase tracking-[0.18em] text-orange-deep hover:text-orange"
          >
            Reply
          </a>
        </div>
      </header>

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
        <p className="font-display text-2xl uppercase leading-none tracking-[0.04em] text-ink-muted">
          {empty ? "No items in inbox" : "Nothing open"}
        </p>
        <p className="mt-3 text-sm text-ink-muted">
          {empty
            ? `The first issue lands on a Sunday at ${site.sendTime}.`
            : "Select an issue to read it."}
        </p>
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
