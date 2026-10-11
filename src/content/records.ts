import type { MDXComponents } from "mdx/types";
import { Children, isValidElement, type ReactNode } from "react";
import {
  blockId,
  type CardProps,
  type Pills,
  type RecordKind,
  type TrackProps,
} from "@/content/blocks";
import { loadIssue } from "@/content/issues";

/** One album, track or other card from an issue, as its story image shows it. */
export interface IssueRecord {
  /** `blockId(artist, title)`, the same id its listen links carry. */
  id: string;
  kind: RecordKind | "track";
  artist: string;
  title: string;
  year?: number;
  cover?: string;
  pills?: Pills;
}

// Stand-ins for the card blocks. They are never rendered, only found in the
// issue's element tree by identity, so they draw nothing.
function Album() {
  return null;
}
function Media() {
  return null;
}
function Track() {
  return null;
}

/**
 * Every card and track in an issue, in the order the issue has them, read
 * from the issue file itself so a story image can't disagree with the letter.
 *
 * The compiled MDX is called with these stand-ins and no wrapper, which hands
 * back the issue's blocks as elements without rendering any of them; the
 * walk then collects the stand-ins' props, nested tracks included.
 */
export async function issueRecords(slug: string): Promise<IssueRecord[]> {
  const { default: Issue } = await loadIssue(slug);
  // `wrapper: undefined` overrides the default one from mdx-components.tsx,
  // so MDX hands back the blocks instead of wrapping them in the letter.
  const components = { Album, Media, Track, wrapper: undefined } as unknown as MDXComponents;
  const tree = (Issue as (props: { components: MDXComponents }) => ReactNode)({ components });

  const records = new Map<string, IssueRecord>();
  const walk = (node: ReactNode) => {
    Children.forEach(node, (child) => {
      if (!isValidElement<{ children?: ReactNode }>(child)) return;
      if (child.type === Album || child.type === Media) {
        const card = child.props as CardProps;
        add({ ...card, kind: card.kind ?? "album" });
      } else if (child.type === Track) {
        add({ ...(child.props as TrackProps), kind: "track" });
      }
      walk(child.props.children);
    });
  };
  const add = ({
    artist,
    title,
    year,
    kind,
    cover,
    pills,
  }: Omit<IssueRecord, "id"> & { year?: number }) => {
    const id = blockId(artist, title);
    if (!records.has(id)) records.set(id, { id, kind, artist, title, year, cover, pills });
  };

  walk(tree);
  return [...records.values()];
}
