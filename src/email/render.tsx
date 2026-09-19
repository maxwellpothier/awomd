import { render } from "@react-email/components";
import { createEmailComponents } from "@/components/blocks/email";
import { IssueEmail } from "@/components/email/IssueEmail";
import { findIssue, issueDateLabel, loadIssue } from "@/content/issues";

export interface RenderIssueOptions {
  slug: string;
  /** Absolute origin. Images and links in email cannot be relative. */
  baseUrl: string;
  /**
   * Per-recipient unsubscribe link. The send command passes a real tokenised
   * URL; previews pass a placeholder.
   */
  unsubscribeUrl: string;
}

export interface RenderedIssue {
  html: string;
  /** Multipart alternative. Clients that refuse HTML still get the issue. */
  text: string;
  subject: string;
}

/**
 * Render an issue as email.
 *
 * This is the only code path that produces email HTML. The web page and the
 * send command both reach it through the same route, so what gets previewed
 * and what gets sent cannot drift apart.
 */
export async function renderIssueEmail({
  slug,
  baseUrl,
  unsubscribeUrl,
}: RenderIssueOptions): Promise<RenderedIssue> {
  const meta = findIssue(slug);
  if (!meta) throw new Error(`Unknown issue: ${slug}`);

  const { default: Issue } = await loadIssue(slug);
  const origin = baseUrl.replace(/\/$/, "");
  const components = createEmailComponents({ issue: slug, baseUrl: origin });

  const document = (
    <IssueEmail
      title={meta.title}
      dateLabel={issueDateLabel(meta.date)}
      issueNumber={meta.number}
      preview={meta.preview}
      baseUrl={origin}
      permalink={`${origin}/issues/${meta.slug}`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Issue components={components} />
    </IssueEmail>
  );

  const [html, text] = await Promise.all([
    render(document),
    render(document, { plainText: true }),
  ]);

  return {
    html,
    text,
    subject: `${meta.title} · Issue ${meta.number}`,
  };
}
