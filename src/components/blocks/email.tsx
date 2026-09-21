import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section as EmailSection,
  Text,
} from "@react-email/components";
import type { MDXComponents } from "mdx/types";
import { color, font } from "@/design/tokens";
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
 * The renderers for every block.
 *
 * There is no web counterpart: the site renders these inline (see
 * `site/Letter.tsx`), so what the page shows is what the inbox gets. Three
 * rules hold throughout:
 * every style is inline (Outlook ignores custom properties, Gmail strips
 * stylesheets), every layout is a table (no flexbox), and every image is an
 * absolute URL with explicit dimensions.
 *
 * Colours come from `tokens.ts` as literals, which is the whole reason that
 * file exists.
 */

function blockId(...parts: (string | undefined)[]): string {
  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const prose = {
  margin: "0 0 14px",
  fontFamily: font.serif,
  fontSize: "17px",
  lineHeight: "27px",
  color: color.ink,
} as const;

const label = {
  margin: "0",
  fontFamily: font.display,
  fontSize: "11px",
  letterSpacing: "1.6px",
  textTransform: "uppercase",
  color: color.inkMuted,
} as const;

export function createEmailComponents(at: {
  issue: string;
  /** Absolute origin for images — email cannot resolve relative paths. */
  baseUrl: string;
}): MDXComponents {
  const stamp = (href: string, block: string) =>
    at.issue ? listenUrl(href, { issue: at.issue, block }) : href;

  const absolute = (src: string) =>
    /^https?:\/\//.test(src) ? src : `${at.baseUrl.replace(/\/$/, "")}${src}`;

  /**
   * Pills render as inline text rather than bordered chips: rounded borders
   * are unreliable across clients, and a row of them is not worth a nested
   * table. The separator carries the same rhythm.
   */
  function Pills({ pills }: { pills?: PillList }) {
    if (!pills?.length) return null;
    return (
      <Text
        style={{
          ...label,
          margin: "6px 0 0",
          color: color.orangeDeep,
          letterSpacing: "1.4px",
        }}
      >
        {pills.join("  ·  ")}
      </Text>
    );
  }

  function Section({ title, children }: SectionProps) {
    return (
      <EmailSection style={{ marginTop: "40px" }}>
        <Text
          style={{
            margin: "0",
            fontFamily: font.display,
            fontSize: "24px",
            lineHeight: "28px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: color.ink,
          }}
        >
          {title}
        </Text>
        <div
          style={{
            width: "44px",
            height: "3px",
            backgroundColor: color.orange,
            marginTop: "6px",
          }}
        />
        <div style={{ marginTop: "20px" }}>{children}</div>
      </EmailSection>
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
      <EmailSection style={{ marginTop: "28px" }}>
        <Row>
          {cover ? (
            <Column style={{ width: "112px", verticalAlign: "top" }}>
              <Img
                src={absolute(cover)}
                alt={`${title} by ${artist}`}
                width="96"
                height="96"
                style={{ display: "block", borderRadius: "2px" }}
              />
            </Column>
          ) : null}
          <Column style={{ verticalAlign: "top" }}>
            <Text style={label}>
              {kindLabel(kind)}
              {year ? ` · ${year}` : ""}
            </Text>
            <Text
              style={{
                margin: "4px 0 0",
                fontFamily: font.display,
                fontSize: "19px",
                lineHeight: "23px",
                textTransform: "uppercase",
                color: color.ink,
              }}
            >
              {title}
            </Text>
            <Text
              style={{
                margin: "2px 0 0",
                fontFamily: font.serif,
                fontSize: "15px",
                color: color.inkMuted,
              }}
            >
              {artist}
            </Text>
            <Pills pills={pills} />
            {href ? (
              <Text style={{ margin: "10px 0 0" }}>
                <Link
                  href={stamp(href, id)}
                  style={{
                    ...label,
                    color: color.orange,
                    textDecoration: "underline",
                  }}
                >
                  Listen
                </Link>
              </Text>
            ) : null}
          </Column>
        </Row>
        {children ? <div style={{ marginTop: "16px" }}>{children}</div> : null}
      </EmailSection>
    );
  }

  function Track({ title, artist, pills, href, note }: TrackProps) {
    const id = blockId(artist, title);
    return (
      <EmailSection
        style={{
          marginTop: "18px",
          borderLeft: `2px solid ${color.creamDeep}`,
          paddingLeft: "14px",
        }}
      >
        <Text
          style={{
            margin: "0",
            fontFamily: font.display,
            fontSize: "16px",
            lineHeight: "20px",
            textTransform: "uppercase",
            color: color.ink,
          }}
        >
          {href ? (
            <Link
              href={stamp(href, id)}
              style={{ color: color.ink, textDecoration: "underline" }}
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </Text>
        <Text
          style={{
            margin: "2px 0 0",
            fontFamily: font.serif,
            fontSize: "14px",
            color: color.inkMuted,
          }}
        >
          {artist}
        </Text>
        {note ? <Text style={{ ...prose, margin: "6px 0 0" }}>{note}</Text> : null}
        <Pills pills={pills} />
      </EmailSection>
    );
  }

  function PullQuote({ text, cite }: PullQuoteProps) {
    return (
      <EmailSection
        style={{
          margin: "28px 0",
          borderLeft: `2px solid ${color.orange}`,
          paddingLeft: "18px",
        }}
      >
        <Text
          style={{
            margin: "0",
            fontFamily: font.display,
            fontSize: "18px",
            lineHeight: "24px",
            textTransform: "uppercase",
            color: color.ink,
          }}
        >
          {text}
        </Text>
        {cite ? (
          <Text style={{ ...label, margin: "8px 0 0" }}>— {cite}</Text>
        ) : null}
      </EmailSection>
    );
  }

  function Divider() {
    return (
      <Hr
        style={{
          margin: "34px 0",
          border: "none",
          borderTop: `1px solid ${color.creamDeep}`,
        }}
      />
    );
  }

  return {
    Section,
    Album: Card,
    Media: Card,
    Track,
    PullQuote,
    Divider,

    p: (props) => <Text style={prose} {...props} />,
    a: (props) => (
      <Link style={{ color: color.ink, textDecoration: "underline" }} {...props} />
    ),
    strong: (props) => <strong style={{ fontWeight: 600 }} {...props} />,
    ul: (props) => (
      <ul
        style={{ ...prose, paddingLeft: "20px", margin: "0 0 14px" }}
        {...props}
      />
    ),
    ol: (props) => (
      <ol
        style={{ ...prose, paddingLeft: "20px", margin: "0 0 14px" }}
        {...props}
      />
    ),
    li: (props) => <li style={{ marginBottom: "6px" }} {...props} />,
    blockquote: (props) => (
      <blockquote
        style={{
          margin: "20px 0",
          borderLeft: `2px solid ${color.creamDeep}`,
          paddingLeft: "18px",
          color: color.inkMuted,
        }}
        {...props}
      />
    ),
    hr: () => <Divider />,
  };
}
