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
  /**
   * Three of the issue's covers, fanned out behind its card on the homepage,
   * the first the most visible. Pick for colour: the card has little else.
   * Paths under /public.
   */
  covers?: string[];
}

/** Newest first. */
export const issues: IssueMeta[] = [
  {
    slug: "2026-10-04",
    number: "002",
    title: "There Are No Wrong Keys",
    date: "2026-10-04",
    preview:
      "I started training muay thai a few weeks ago, and it sent me back to jazz. Thelonious Monk alone in San Francisco, Yo La Tengo at 20, and a few more songs.",
    covers: [
      "/covers/yo-la-tengo-i-am-not-afraid-of-you.jpg",
      "/covers/thelonious-monk-thelonious-alone-in-san-francisco.jpg",
      "/covers/natalie-merchant-san-andreas-fault.jpg",
    ],
  },
  {
    slug: "2026-09-27",
    number: "001",
    title: "The Gen Z Kids Are Alright",
    date: "2026-09-27",
    preview:
      "Two years ago I'd have told you Gen Z was in a music drought. Now it's most of what excites me. Lucy Bedroque, mary in the junkyard, and a few tracks.",
    covers: [
      "/covers/the-avalanches-far-away.jpg",
      "/covers/lucy-bedroque-unmusique.jpg",
      "/covers/mary-in-the-junkyard-role-model-hermit.jpg",
    ],
  },
];

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
