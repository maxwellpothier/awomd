import { createWebComponents } from "@/components/blocks/web";
import { issueDateLabel, loadIssue, type IssueMeta } from "@/content/issues";

/**
 * One issue, rendered for the web.
 *
 * Shared by the home page (latest issue) and the permalink, so "the latest
 * issue" and "that issue forever" are never two different renderings.
 */
export async function IssueArticle({ meta }: { meta: IssueMeta }) {
  const { default: Issue } = await loadIssue(meta.slug);
  const components = createWebComponents({ issue: meta.slug });

  return (
    <article className="mx-auto max-w-2xl px-6 py-14 sm:py-20">
      <header>
        <p className="font-display text-[11px] uppercase tracking-[0.22em] text-orange-deep">
          Issue {meta.number} · {issueDateLabel(meta.date)}
        </p>
        <h1 className="mt-3 font-display text-4xl uppercase leading-[0.95] tracking-[0.01em] sm:text-5xl">
          {meta.title}
        </h1>
        <div className="mt-5 h-0.5 w-16 bg-orange" aria-hidden />
      </header>

      <div className="mt-10 text-lg leading-8">
        <Issue components={components} />
      </div>

      {process.env.NODE_ENV === "development" ? (
        <p className="mt-16 border-t border-cream-deep pt-5 font-display text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          <a
            href={`/issues/${meta.slug}/email`}
            className="text-orange underline decoration-orange/40 underline-offset-4 hover:decoration-orange"
          >
            View the email render
          </a>{" "}
          — dev only
        </p>
      ) : null}
    </article>
  );
}
