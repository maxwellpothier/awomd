import { findIssue, issueDateLabel, issues } from "@/content/issues";
import { previewImage, previewSize } from "@/images/preview";

/** The card under a link to an issue: its title on a torn sheet, its covers beside it. */
export const alt = "This week's issue of A Week on My Desk, with three of its album covers";
export const size = previewSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = findIssue(slug);
  if (!meta) return new Response("Unknown issue", { status: 404 });
  return previewImage({
    dateline: `Issue ${meta.number} · ${issueDateLabel(meta.date)}`,
    title: meta.title,
    line: meta.preview,
    covers: meta.covers ?? [],
  });
}

export function generateStaticParams() {
  return issues.map(({ slug }) => ({ slug }));
}
