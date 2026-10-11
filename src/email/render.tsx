import { render } from "@react-email/components";
import { createEmailComponents } from "@/components/blocks/email";
import { IssueEmail, WelcomeNote } from "@/components/email/IssueEmail";
import { site } from "@/content/site";
import { findIssue, issueDateLabel, loadIssue } from "@/content/issues";

export interface RenderIssueOptions {
  slug: string;
  /** Absolute origin. Images and links in email cannot be relative. */
  baseUrl: string;
  /**
   * Where the footer's unsubscribe link points. One URL for everyone today;
   * per-recipient tokens need the subscribers table.
   */
  unsubscribeUrl: string;
  /**
   * The welcome version: the latest issue as a new subscriber gets it on
   * confirming, with a note above the banner and its own subject.
   */
  welcome?: boolean;
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
  welcome = false,
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
      preview={
        welcome ? "Here's the latest issue, so you don't have to wait for Sunday." : meta.preview
      }
      baseUrl={origin}
      permalink={`${origin}/issues/${meta.slug}`}
      unsubscribeUrl={unsubscribeUrl}
      shareUrl={`${origin}/issues/${meta.slug}/share`}
      subscribeUrl={`${origin}/?ref=forward`}
      note={welcome ? <WelcomeNote /> : undefined}
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
    subject: welcome ? `Welcome to ${site.name}` : meta.title,
  };
}
