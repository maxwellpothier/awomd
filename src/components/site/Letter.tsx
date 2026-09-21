import { createEmailComponents } from "@/components/blocks/email";
import { IssueLetter } from "@/components/email/IssueEmail";
import { issueDateLabel, loadIssue, type IssueMeta } from "@/content/issues";
import { unsubscribeHref } from "@/content/site";

/**
 * An issue as it lands in the inbox, rendered inline on the site.
 *
 * Same block renderers, same letter component as the send — with relative
 * URLs instead of absolute ones, because this is served from our own origin.
 * Loading the homepage is therefore a preview of the email, not a picture of
 * it. The `.letter` class maps the email's named font stacks onto the
 * webfonts the page has loaded (see globals.css).
 */
export async function Letter({ meta }: { meta: IssueMeta }) {
  const { default: Issue } = await loadIssue(meta.slug);
  const components = createEmailComponents({ issue: meta.slug, baseUrl: "" });

  return (
    <div className="letter shadow-[0_1px_3px_rgba(15,19,30,0.10),0_8px_28px_-12px_rgba(15,19,30,0.18)]">
      <IssueLetter
        title={meta.title}
        dateLabel={issueDateLabel(meta.date)}
        issueNumber={meta.number}
        baseUrl=""
        permalink={`/issues/${meta.slug}`}
        unsubscribeUrl={unsubscribeHref}
      >
        <Issue components={components} />
      </IssueLetter>
    </div>
  );
}
