import { findIssue, issues } from "@/content/issues";
import { postImage } from "@/images/story";

/** The issue as a square for the Instagram feed, made at build time. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const meta = findIssue((await params).slug);
  if (!meta) return new Response("Unknown issue", { status: 404 });
  return postImage(meta);
}

export function generateStaticParams() {
  return issues.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;
