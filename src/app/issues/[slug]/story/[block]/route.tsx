import { findIssue, issues } from "@/content/issues";
import { issueRecords } from "@/content/records";
import { storyImage } from "@/images/story";

/**
 * An issue's story images: `/issues/<slug>/story/issue` for the issue as a
 * whole, `/issues/<slug>/story/<block id>` for one record in it. The share
 * page (`../share`) lays them out to pick from. All made at build time.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; block: string }> },
) {
  const { slug, block } = await params;
  const meta = findIssue(slug);
  if (!meta) return new Response("Unknown issue", { status: 404 });
  if (block === "issue") return storyImage(meta);

  const record = (await issueRecords(slug)).find((r) => r.id === block);
  if (!record) return new Response("Unknown record", { status: 404 });
  return storyImage(meta, record);
}

export async function generateStaticParams() {
  const all = await Promise.all(
    issues.map(async ({ slug }) => [
      { slug, block: "issue" },
      ...(await issueRecords(slug)).map((record) => ({ slug, block: record.id })),
    ]),
  );
  return all.flat();
}

export const dynamicParams = false;
