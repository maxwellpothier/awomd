import { issueDateLabel, issues } from "@/content/issues";
import { site } from "@/content/site";

/**
 * RSS, for readers who'd rather follow along in a feed reader. Each item is
 * the issue's preview line and a link to read it, ending with the way to get
 * it by email: the letter is the thing, and the feed points at it.
 */
export function GET() {
  const description =
    "More people should share the music that moves them, so here's mine, every Sunday evening.";

  const items = issues.map((issue) => {
    const link = `${site.url}/issues/${issue.slug}`;
    const body =
      `<p>Issue ${issue.number} · ${issueDateLabel(issue.date)}</p>` +
      `<p>${escape(issue.preview)}</p>` +
      `<p><a href="${link}?ref=rss">Read issue ${issue.number}</a>, or ` +
      `<a href="${site.url}/?ref=rss">get it by email every Sunday</a>.</p>`;
    return `    <item>
      <title>${escape(issue.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(`${issue.date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escape(body)}</description>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(site.name)}</title>
    <link>${site.url}</link>
    <description>${escape(description)}</description>
    <language>en-us</language>
    <atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml" />
${items.join("\n")}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}

// Nothing in it depends on the request: build it once, with the issues.
export const dynamic = "force-static";

function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
