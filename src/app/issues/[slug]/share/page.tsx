import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoryTile } from "@/components/site/StoryTile";
import { findIssue, issues } from "@/content/issues";
import { issueRecords } from "@/content/records";

export function generateStaticParams() {
  return issues.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const meta = findIssue((await params).slug);
  if (!meta) return {};
  return {
    title: `Share issue ${meta.number}`,
    description: `Story images for ${meta.title}, to share on Instagram.`,
    robots: { index: false },
  };
}

/**
 * "Share on your story", from the letter's footer and the inbox's Share
 * button: the issue's story images, the whole issue first and then each
 * record in it, so a reader can post the issue or just the album they liked.
 */
export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = findIssue(slug);
  if (!meta) notFound();
  const records = (await issueRecords(slug)).filter((record) => record.cover);
  const linkPath = `/issues/${slug}?ref=story`;

  return (
    <article className="mx-auto max-w-5xl px-6 pb-20 pt-8 sm:px-8 sm:pt-12">
      <p>
        <Link
          href={`/issues/${slug}`}
          className="text-[15px] text-ink-muted transition-colors hover:text-ink"
        >
          ← Back to the issue
        </Link>
      </p>
      <h1 className="mt-6 text-balance font-display text-[40px] leading-[1.08] sm:text-[56px]">
        Share it on your story
      </h1>
      <p className="mt-5 max-w-2xl text-pretty text-lg leading-[1.6] sm:text-[19px]">
        Post the whole issue, or just the record that got you. On your phone,
        tap Share and pick Instagram. The link to the issue is copied at the
        same time, so you can paste it into a link sticker.
      </p>

      <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        <li>
          <StoryTile
            src={`/issues/${slug}/story/issue`}
            filename={`awomd-${meta.number}.png`}
            linkPath={linkPath}
            title="The whole issue"
            byline={meta.title}
            priority
          />
        </li>
        {records.map((record) => (
          <li key={record.id}>
            <StoryTile
              src={`/issues/${slug}/story/${record.id}`}
              filename={`awomd-${meta.number}-${record.id}.png`}
              linkPath={linkPath}
              title={record.title}
              byline={record.artist}
            />
          </li>
        ))}
      </ul>
    </article>
  );
}
