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
  // The send fetches one render per recipient, passing their unsubscribe
  // token, so the footer button takes that reader off in one click. Without
  // one (a preview) it goes to /unsubscribe, which explains the way off.
  const token = url.searchParams.get("token");
  const unsubscribeUrl = token
    ? `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(token)}`
    : `${baseUrl}/unsubscribe`;
  const rendered = await renderIssueEmail({ slug, baseUrl, unsubscribeUrl });

  const wantsText = url.searchParams.get("text") !== null;
  return new Response(wantsText ? rendered.text : rendered.html, {
    // No subject header: HTTP headers cannot carry UTF-8, and the subject
    // has a "·" in it. The send command reads metadata from the registry
    // directly rather than round-tripping it through a header.
    headers: {
      // The same URL goes in the message's List-Unsubscribe header, and the
      // send has no other way to know the public origin it was built with.
      "x-unsubscribe-url": unsubscribeUrl,
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
