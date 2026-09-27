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
import { color, displayWeight, font, pillColors } from "@/design/tokens";
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

/**
 * Which of `pillColors` a pill gets: picked from its text, so it is the same
 * everywhere, then moved along one if it would match the pill before it.
 */
function pillTint(pill: string, previous: number): number {
  let hash = 0;
  for (const char of pill.toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  const index = hash % pillColors.length;
  return index === previous ? (index + 1) % pillColors.length : index;
}

const prose = {
  margin: "0 0 14px",
  fontFamily: font.serif,
  fontSize: "17px",
  lineHeight: "27px",
  color: color.ink,
} as const;

/** Small metadata lines: kind and year, pills, Listen, citations. */
const label = {
  margin: "0",
  fontFamily: font.serif,
  fontSize: "13px",
  lineHeight: "18px",
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
   * Pills are rounded chips, each tinted by its text (`pillTint`). Inline-block
   * spans rather than a table, so a long row wraps on a phone. Classic Outlook
   * on Windows draws the corners square.
   */
  function Pills({ pills }: { pills?: PillList }) {
    if (!pills?.length) return null;
    let previous = -1;
    return (
      <Text style={{ margin: "8px 0 0", lineHeight: "0" }}>
        {pills.map((pill) => {
          previous = pillTint(pill, previous);
          return (
            <span
              key={pill}
              style={{
                display: "inline-block",
                margin: "0 5px 5px 0",
                padding: "2px 8px",
                borderRadius: "999px",
                backgroundColor: pillColors[previous],
                fontFamily: font.serif,
                fontSize: "12px",
                lineHeight: "16px",
                color: color.ink,
              }}
            >
              {pill}
            </span>
          );
        })}
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
            fontWeight: displayWeight,
            fontSize: "24px",
            lineHeight: "30px",
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
    const header = (
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
            {href && kind === "album" ? (
              <Text
                aria-hidden="true"
                style={{
                  ...label,
                  margin: "4px 0 0",
                  width: "96px",
                  textAlign: "right",
                  color: color.orange,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "12px",
                  lineHeight: "14px",
                }}
              >
                ↗
              </Text>
            ) : null}
          </Column>
        ) : null}
        <Column style={{ verticalAlign: "top" }}>
          {/* An album is the default and needs no label; other kinds
              still say what they are. */}
          {kind !== "album" || year ? (
            <Text style={label}>
              {[kind === "album" ? undefined : kindLabel(kind), year]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          ) : null}
          <Text
            style={{
              margin: "4px 0 0",
              fontFamily: font.display,
              fontWeight: displayWeight,
              fontSize: "24px",
              lineHeight: "28px",
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
          {href && (kind !== "album" || !cover) ? (
            <Text style={{ margin: "10px 0 0" }}>
              <span
                style={{
                  ...label,
                  color: color.orange,
                  textDecoration: "underline",
                }}
              >
                Listen
              </span>
            </Text>
          ) : null}
        </Column>
      </Row>
    );
    return (
      <EmailSection style={{ marginTop: "28px" }}>
        {/* With a link, the whole header (cover, title, artist, pills) is
            one link. The prose underneath stays outside it, since it can
            hold links of its own and email can't nest them. */}
        {href ? (
          <Link
            href={stamp(href, id)}
            style={{ display: "block", textDecoration: "none", color: color.ink }}
          >
            {header}
          </Link>
        ) : (
          header
        )}
        {children ? <div style={{ marginTop: "16px" }}>{children}</div> : null}
      </EmailSection>
    );
  }

  function Track({ title, artist, cover, pills, href, children }: TrackProps) {
    const id = blockId(artist, title);
    return (
      <EmailSection
        style={{
          marginTop: "18px",
          borderLeft: cover ? undefined : `2px solid ${color.creamDeep}`,
          paddingLeft: cover ? undefined : "14px",
        }}
      >
        <Row>
          {cover ? (
            <Column style={{ width: "80px", verticalAlign: "top" }}>
              <Img
                src={absolute(cover)}
                alt={`${title} by ${artist}`}
                width="64"
                height="64"
                style={{ display: "block", borderRadius: "2px" }}
              />
            </Column>
          ) : null}
          <Column style={{ verticalAlign: "top" }}>
            <Text
              style={{
                margin: "0",
                fontFamily: font.display,
                fontWeight: displayWeight,
                fontSize: "16px",
                lineHeight: "21px",
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
            {href ? (
              <Text style={{ margin: "2px 0 0", lineHeight: label.lineHeight }}>
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
            {!cover && children ? (
              <div style={{ marginTop: "6px" }}>{children}</div>
            ) : null}
            <Pills pills={pills} />
          </Column>
        </Row>
        {/* The note arrives as markdown paragraphs, which carry their own
            prose style, links included. */}
        {cover && children ? (
          <div style={{ marginTop: "14px" }}>{children}</div>
        ) : null}
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
            fontWeight: displayWeight,
            fontSize: "18px",
            lineHeight: "24px",
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
      <Link style={{ color: color.link, textDecoration: "underline" }} {...props} />
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
