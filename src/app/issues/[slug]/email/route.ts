import { findIssue, issues } from "@/content/issues";
import { renderIssueEmail } from "@/email/render";

/**
 * The email render of an issue, as raw HTML.
 *
 * Both the preview toggle and `npm run send` read from here, which is what
 * makes "what you previewed is what was sent" true by construction rather
 * than by discipline.
 *
 * `?text=1` returns the plain-text alternative instead.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!findIssue(slug)) {
    return new Response(`Unknown issue: ${slug}`, { status: 404 });
  }

  const url = new URL(request.url);
  const baseUrl = process.env.SITE_URL ?? url.origin;
  const rendered = await renderIssueEmail({
    slug,
    baseUrl,
    // The same URL for every recipient, because there are no per-recipient
    // tokens until the subscribers table lands. The page it points at explains
    // how to get off the list; it does not pretend to have done it. When tokens
    // arrive this gains a `?token=` and nothing else here changes.
    unsubscribeUrl: `${baseUrl}/unsubscribe`,
  });

  const wantsText = url.searchParams.get("text") !== null;
  return new Response(wantsText ? rendered.text : rendered.html, {
    // No subject header: HTTP headers cannot carry UTF-8, and the subject
    // has a "·" in it. The send command reads metadata from the registry
    // directly rather than round-tripping it through a header.
    headers: {
      "content-type": wantsText
        ? "text/plain; charset=utf-8"
        : "text/html; charset=utf-8",
    },
  });
}

export function generateStaticParams() {
  return issues.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;
