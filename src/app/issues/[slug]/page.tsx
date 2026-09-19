import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IssueArticle } from "@/components/site/IssueArticle";
import { findIssue, issues } from "@/content/issues";

export function generateStaticParams() {
  return issues.map(({ slug }) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = findIssue(slug);
  if (!meta) return {};
  return {
    title: `${meta.title} · Issue ${meta.number}`,
    description: meta.preview,
    openGraph: {
      title: `${meta.title} · Issue ${meta.number}`,
      description: meta.preview,
      type: "article",
      publishedTime: meta.date,
      url: `/issues/${meta.slug}`,
    },
  };
}

export default async function IssuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = findIssue(slug);
  if (!meta) notFound();
  return <IssueArticle meta={meta} />;
}
