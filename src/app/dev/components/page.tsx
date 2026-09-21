import { notFound } from "next/navigation";
import type { ComponentType, PropsWithChildren, ReactNode } from "react";
import { createEmailComponents } from "@/components/blocks/email";

type Block = ComponentType<PropsWithChildren<Record<string, unknown>>>;

/**
 * The components gallery — every block, with sample data.
 *
 * This is the design surface: the cream/navy/orange system gets decided here,
 * not inside an issue. It is also the regression check — if a block breaks,
 * it breaks here before it breaks in someone's inbox.
 *
 * Blocks have one renderer, the email one, and the site shows it inline
 * inside `.letter` (see globals.css), so this page wraps the specimens the
 * same way the reading pane does.
 */
export default function ComponentsGallery() {
  // Never ship a design surface to production.
  if (process.env.NODE_ENV !== "development") notFound();

  // The MDX map is keyed by tag name, so pull the pieces out under names JSX
  // can use. The cast is the price of a map that is deliberately untyped per
  // key — the real prop types live on the block components themselves.
  const map = createEmailComponents({
    issue: "gallery",
    baseUrl: "",
  }) as Record<string, Block>;
  const { Section, Album, Media, Track, PullQuote, Divider } = map;
  const { p: P, a: A, strong: Strong, ul: Ul, blockquote: Quote } = map;

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-orange-deep">
        Dev only
      </p>
      <h1 className="mt-3 font-display text-4xl uppercase leading-none">
        Components
      </h1>
      <div className="mt-4 h-0.5 w-16 bg-orange" aria-hidden />

      <div className="letter">
        <Specimen label="Section + Album with prose">
          <Section title="On Repeat">
            <Album
              artist="Placeholder Artist"
              title="A Record With A Long Enough Name To Wrap"
              year={2026}
              cover="/covers/placeholder-01.png"
              href="https://example.com/album"
              pills={["rage", "twangy", "loud"]}
            >
              <P>
                Prose beneath a card, which is where the actual thinking goes.
              </P>
            </Album>
          </Section>
        </Specimen>

        <Specimen label="Album with nested Track">
          <Album
            artist="Another Placeholder"
            title="Shorter Title"
            year={2019}
            cover="/covers/placeholder-02.png"
            href="https://example.com/album-2"
            pills={["acoustic", "slow"]}
          >
            <Track
              title="The One Good Song"
              artist="Another Placeholder"
              href="https://example.com/track"
              pills={["quiet"]}
              note="One line about why this track and not the others."
            />
          </Album>
        </Specimen>

        <Specimen label="Card with no cover (sparse case)">
          <Media
            kind="book"
            artist="An Author"
            title="Something Read This Week"
            year={1978}
          />
        </Specimen>

        <Specimen label="Standalone Track, no link, no pills">
          <Track
            title="A Standalone Track"
            artist="Third Placeholder"
            note="The sparse path has to look deliberate too."
          />
        </Specimen>

        <Specimen label="PullQuote">
          <PullQuote
            text="A pull quote, for when a line is worth stopping on."
            cite="Someone worth quoting"
          />
        </Specimen>

        <Specimen label="Divider">
          <Divider />
        </Specimen>

        <Specimen label="Markdown primitives">
          <P>
            Body copy with <Strong>bold</Strong> and{" "}
            <A href="https://example.com">a link</A> in it.
          </P>
          <Ul>
            <li>First item</li>
            <li>Second item</li>
          </Ul>
          <Quote>
            <P>A plain markdown blockquote, distinct from a PullQuote.</P>
          </Quote>
        </Specimen>
      </div>
    </div>
  );
}

function Specimen({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-14 border-t border-cream-deep pt-6">
      <h2 className="font-display text-[11px] uppercase tracking-[0.2em] text-ink-muted">
        {label}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
