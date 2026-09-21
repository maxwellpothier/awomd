import type { MDXComponents } from "mdx/types";
import type { ComponentType } from "react";

/**
 * The issue registry.
 *
 * Issues are MDX files in `content/issues/`, listed here explicitly rather than
 * discovered by globbing — the list has to be statically analysable so routes
 * can be prerendered, and one line per issue is not a workflow that hurts yet.
 */
export interface IssueMeta {
  /** Also the filename and the URL: content/issues/<slug>.mdx → /issues/<slug> */
  slug: string;
  /** Zero-padded, as it appears in the banner. */
  number: string;
  title: string;
  /** ISO date the issue goes out. */
  date: string;
  /** Inbox preview line, and the meta description on the web. */
  preview: string;
}

/**
 * Newest first. Empty until the first issue goes out — the inbox shows its
 * empty state, and an issue is registered on the branch that ships it.
 */
export const issues: IssueMeta[] = [];

/** Undefined until the first issue is registered — the inbox shows its empty state. */
export const latestIssue: IssueMeta | undefined = issues.at(0);

export function findIssue(slug: string): IssueMeta | undefined {
  return issues.find((issue) => issue.slug === slug);
}

export function issueDateLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** An MDX module compiled by @next/mdx accepts a components map as a prop. */
type IssueModule = {
  default: ComponentType<{ components?: MDXComponents }>;
};

/**
 * Load an issue's compiled MDX.
 *
 * The caller supplies the component map, which is the whole hinge of the
 * design: the same module renders the web document or the email document
 * depending on what gets passed in.
 */
export async function loadIssue(slug: string): Promise<IssueModule> {
  return (await import(`../../content/issues/${slug}.mdx`)) as IssueModule;
}
