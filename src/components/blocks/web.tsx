import Image from "next/image";
import type { MDXComponents } from "mdx/types";
import {
  kindLabel,
  listenUrl,
  type CardProps,
  type Pills as PillList,
  type PullQuoteProps,
  type SectionProps,
  type TrackProps,
} from "@/content/blocks";

/**
 * Web renderers for every block.
 *
 * The map is built per issue rather than exported flat, so each block can stamp
 * its outbound links with the issue slug without needing React context — which
 * is unavailable here, since these all render on the server.
 */

/** Stable, human-readable block id derived from what the block is about. */
function blockId(...parts: (string | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function Pills({ pills }: { pills?: PillList }) {
  if (!pills?.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-x-2 gap-y-1.5">
      {pills.map((pill) => (
        <li
          key={pill}
          className="rounded-full border border-orange/35 px-2.5 py-0.5 font-display text-[11px] uppercase tracking-[0.14em] text-orange-deep"
        >
          {pill}
        </li>
      ))}
    </ul>
  );
}

export function createWebComponents(at: { issue: string }): MDXComponents {
  /** Only stamp identity when we know which issue we're in. */
  const stamp = (href: string, block: string) =>
    at.issue ? listenUrl(href, { issue: at.issue, block }) : href;

  function Section({ title, children }: SectionProps) {
    return (
      <section className="mt-14 first:mt-0">
        <h2 className="font-display text-2xl uppercase leading-none tracking-[0.06em] sm:text-3xl">
          {title}
        </h2>
        <div className="mt-1 h-0.5 w-12 bg-orange" aria-hidden />
        <div className="mt-6">{children}</div>
      </section>
    );
  }

  function Card({
    artist,
    title,
    year,
    kind = "album",
    cover,
    href,
    pills,
    children,
  }: CardProps) {
    const id = blockId(artist, title);
    return (
      <article className="mt-8 first:mt-0">
        <div className="flex gap-4 sm:gap-5">
          {cover ? (
            <Image
              src={cover}
              alt={`${title} by ${artist}`}
              width={600}
              height={600}
              sizes="(max-width: 640px) 96px, 128px"
              className="h-24 w-24 flex-none rounded-sm object-cover sm:h-32 sm:w-32"
            />
          ) : (
            <div
              className="h-24 w-24 flex-none rounded-sm bg-cream-deep sm:h-32 sm:w-32"
              aria-hidden
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-display text-[11px] uppercase tracking-[0.18em] text-ink-muted">
              {kindLabel(kind)}
              {year ? ` · ${year}` : ""}
            </p>
            <h3 className="mt-1 font-display text-xl uppercase leading-tight tracking-[0.02em] sm:text-2xl">
              {title}
            </h3>
            <p className="mt-0.5 text-base text-ink-muted">{artist}</p>
            <Pills pills={pills} />
            {href ? (
              <a
                href={stamp(href, id)}
                className="mt-3 inline-block font-display text-[11px] uppercase tracking-[0.18em] text-orange underline decoration-orange/40 underline-offset-4 hover:decoration-orange"
              >
                Listen
              </a>
            ) : null}
          </div>
        </div>
        {children ? (
          <div className="mt-4 [&>p]:mt-3 [&>p:first-child]:mt-0">
            {children}
          </div>
        ) : null}
      </article>
    );
  }

  function Track({ title, artist, pills, href, note }: TrackProps) {
    const id = blockId(artist, title);
    return (
      <div className="mt-5 border-l-2 border-cream-deep pl-4 first:mt-0">
        <p className="font-display text-base uppercase leading-tight tracking-[0.02em]">
          {href ? (
            <a
              href={stamp(href, id)}
              className="text-ink underline decoration-orange/40 underline-offset-4 hover:decoration-orange"
            >
              {title}
            </a>
          ) : (
            title
          )}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">{artist}</p>
        {note ? <p className="mt-1.5 text-base">{note}</p> : null}
        <Pills pills={pills} />
      </div>
    );
  }

  function PullQuote({ text, cite }: PullQuoteProps) {
    return (
      <blockquote className="my-8 border-l-2 border-orange pl-5">
        <p className="font-display text-lg uppercase leading-snug tracking-[0.02em] sm:text-xl">
          {text}
        </p>
        {cite ? (
          <cite className="mt-2 block text-sm not-italic text-ink-muted">
            — {cite}
          </cite>
        ) : null}
      </blockquote>
    );
  }

  function Divider() {
    return (
      <div className="my-10 flex justify-center gap-2" aria-hidden>
        <span className="h-1 w-1 rounded-full bg-orange/60" />
        <span className="h-1 w-1 rounded-full bg-orange/60" />
        <span className="h-1 w-1 rounded-full bg-orange/60" />
      </div>
    );
  }

  return {
    Section,
    Album: Card,
    Media: Card,
    Track,
    PullQuote,
    Divider,

    // Markdown written in an issue maps onto the same system.
    p: (props) => <p className="mt-4 text-lg leading-8 first:mt-0" {...props} />,
    a: (props) => (
      <a
        className="text-ink underline decoration-orange/50 underline-offset-4 hover:decoration-orange"
        {...props}
      />
    ),
    strong: (props) => <strong className="font-semibold" {...props} />,
    ul: (props) => (
      <ul className="mt-4 list-disc space-y-1.5 pl-5 text-lg leading-8" {...props} />
    ),
    ol: (props) => (
      <ol
        className="mt-4 list-decimal space-y-1.5 pl-5 text-lg leading-8"
        {...props}
      />
    ),
    blockquote: (props) => (
      <blockquote
        className="my-6 border-l-2 border-cream-deep pl-5 text-ink-muted"
        {...props}
      />
    ),
    hr: () => <Divider />,
  };
}

/** Default map for any MDX compiled outside an issue render. */
export const webComponents = createWebComponents({ issue: "" });
