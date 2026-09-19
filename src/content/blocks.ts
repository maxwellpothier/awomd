/**
 * The block vocabulary an issue is written in.
 *
 * Every block here has exactly two renderers — `components/blocks/web` and
 * `components/blocks/email`. An issue file names blocks but never a platform
 * or a layout, which is what lets one file produce both documents.
 */
import type { ReactNode } from "react";

/** What a card is describing. One card type, distinguished by kind. */
export type RecordKind =
  | "album"
  | "ep"
  | "single"
  | "documentary"
  | "book"
  | "show";

/**
 * Canonical output of a resolver, cached as JSON beside the issue.
 *
 * Not wired up yet — covers and metadata are hand-entered on cards until the
 * Spotify resolver lands. The shape is fixed now so that swapping in the
 * resolver changes how a card is *populated*, not how it renders.
 */
export interface ResolvedRecord {
  kind: RecordKind;
  artist: string;
  title: string;
  year?: number;
  /** Mirrored onto our domain at resolve time — never a hotlink. */
  coverUrl?: string;
  links: {
    spotify?: string;
    apple?: string;
    bandcamp?: string;
  };
}

/**
 * Freeform descriptors on a card or track ("rage", "acoustic", "twangy").
 * A property, not a block — pills never stand on their own.
 */
export type Pills = readonly string[];

/** What an issue file writes: `<Album artist="..." title="..." />`. */
export interface CardProps {
  artist: string;
  title: string;
  year?: number;
  kind?: RecordKind;
  /** Absolute path under /public, or an absolute URL once mirrored. */
  cover?: string;
  /** Where "listen" points. Stamped with issue and block identity at render. */
  href?: string;
  pills?: Pills;
  /** Prose beneath the card, and optionally nested Tracks. */
  children?: ReactNode;
}

export interface TrackProps {
  title: string;
  artist: string;
  pills?: Pills;
  href?: string;
  /** One line. Longer thoughts belong in a card's prose. */
  note?: string;
}

export interface SectionProps {
  title: string;
  children?: ReactNode;
}

/**
 * A pull quote is a single line, so it takes `text` rather than children.
 * Children would arrive wrapped in a markdown paragraph, and a paragraph
 * nested inside the quote's own paragraph is invalid HTML — it breaks
 * hydration on the web and is malformed in email.
 */
export interface PullQuoteProps {
  text: string;
  cite?: string;
}

/** Where a block sits, so outbound links stay identifiable as ours. */
export interface BlockLocation {
  /** Issue slug, e.g. "2026-09-20". */
  issue: string;
  /** Stable id for the block within the issue. */
  block: string;
}

/**
 * Stamp a listen link with issue and block identity.
 *
 * Link identity is ours regardless of relay: the email provider rewrites the
 * href for click tracking, but `i` and `b` ride along inside the destination
 * URL, so we can still tell which block a click came from.
 *
 * Returns the href untouched if it isn't a URL we can parse, so a typo in an
 * issue file degrades to a plain link rather than throwing mid-render.
 */
export function listenUrl(href: string, at: BlockLocation): string {
  try {
    const url = new URL(href);
    url.searchParams.set("i", at.issue);
    url.searchParams.set("b", at.block);
    return url.toString();
  } catch {
    return href;
  }
}

/** A short human label for a card's kind, shown next to the year. */
export function kindLabel(kind: RecordKind = "album"): string {
  return kind === "ep" ? "EP" : kind[0].toUpperCase() + kind.slice(1);
}
