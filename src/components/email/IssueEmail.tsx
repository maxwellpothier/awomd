import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { color, displayWeight, font } from "@/design/tokens";

export interface IssueLetterProps {
  title: string;
  dateLabel: string;
  issueNumber: string;
  /** Origin for the banner image. Empty string means "relative", for the site. */
  baseUrl: string;
  /** Permalink for "read in browser". */
  permalink: string;
  /** Replaced per recipient at send time. */
  unsubscribeUrl: string;
  children: ReactNode;
}

export interface IssueEmailProps extends IssueLetterProps {
  /** First line shown in the inbox list, before the reader opens it. */
  preview: string;
}

/**
 * The letter itself: banner, title, blocks, footer. Everything inside the
 * 600px column, nothing about the document around it.
 *
 * This is what the site renders inline in its reading pane, and what
 * `IssueEmail` wraps in a document for the send. One tree, so the page and
 * the inbox cannot show different things.
 */
export function IssueLetter({
  title,
  dateLabel,
  issueNumber,
  baseUrl,
  permalink,
  unsubscribeUrl,
  children,
}: IssueLetterProps) {
  const logo = `${baseUrl.replace(/\/$/, "")}/brand/email-banner.png`;
  const footerTear = `${baseUrl.replace(/\/$/, "")}/brand/footer-tear.png`;

  return (
    <Container
      style={{
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        backgroundColor: color.cream,
      }}
    >
      {/*
        The banner is the image, full bleed — not a logo sitting on a navy
        cell. The navy and its texture are baked in, so there is no seam to
        match, and a client that force-inverts backgrounds in dark mode cannot
        strand the wordmark on the wrong ground.

        Its bottom edge is torn, the same tear as the site's masthead, baked
        in because email can't clip to a shape (scripts/tear-banner.mts,
        `npm run banner`). Below the tear the PNG is transparent, so the
        letter's own background shows through, cream or darkened.
      */}
      <Section style={{ padding: 0 }}>
        <Img
          src={logo}
          alt="A Week on My Desk"
          width="600"
          height="338"
          style={{
            display: "block",
            width: "100%",
            maxWidth: "600px",
            height: "auto",
            border: 0,
          }}
        />
      </Section>

      <Section style={{ padding: "30px 24px 8px" }}>
        <Text
          style={{
            margin: 0,
            fontFamily: font.serif,
            fontSize: "14px",
            lineHeight: "20px",
            color: color.orangeDeep,
          }}
        >
          Issue {issueNumber} · {dateLabel}
        </Text>
        <Text
          style={{
            margin: "10px 0 0",
            fontFamily: font.display,
            fontWeight: displayWeight,
            fontSize: "30px",
            lineHeight: "36px",
            color: color.ink,
          }}
        >
          {title}
        </Text>
      </Section>

      {/* No side padding: the issue's `wrapper` (blocks/email.tsx) pads the
          body itself, so a torn divider can run the letter's full width. */}
      <Section style={{ padding: "8px 0 36px" }}>{children}</Section>

      {/*
        Footer: a navy sheet torn along its top and laid on the letter, the
        banner's tear turned to face up. The tear is baked into an image
        (scripts/tear-footer.mts, `npm run footer`), transparent above it; the
        rest is a plain navy cell, flat to match, so the copy stays live text.

        Unsubscribe works on first click, no login, no confirmation page.
        Postal address is deferred per PLAN.md.
      */}
      <Section style={{ padding: 0 }}>
        <Img
          src={footerTear}
          alt=""
          width="600"
          height="28"
          style={{
            display: "block",
            width: "100%",
            maxWidth: "600px",
            height: "auto",
            border: 0,
          }}
        />
      </Section>
      <Section
        style={{
          backgroundColor: color.navy,
          padding: "14px 24px 30px",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontFamily: font.serif,
            fontSize: "17px",
            lineHeight: "26px",
            color: color.cream,
          }}
        >
          {"That's the desk this week. Reply and tell me what's on yours."}
        </Text>
        <Button
          href={unsubscribeUrl}
          style={{
            marginTop: "22px",
            padding: "9px 20px",
            border: `1px solid ${color.cream}`,
            borderRadius: "999px",
            fontFamily: font.serif,
            fontSize: "14px",
            lineHeight: "20px",
            color: color.cream,
          }}
        >
          Unsubscribe
        </Button>
        <Text
          style={{
            margin: "18px 0 0",
            fontFamily: font.serif,
            fontSize: "13px",
            lineHeight: "18px",
          }}
        >
          <Link href={permalink} style={{ color: color.cream }}>
            Read in browser
          </Link>
        </Text>
      </Section>
    </Container>
  );
}

/** The letter wrapped in an email document. This is what gets sent. */
export function IssueEmail({ preview, ...letter }: IssueEmailProps) {
  return (
    <Html lang="en">
      <Head>
        {/*
          Apple Mail and Outlook honour these and leave our palette alone.
          Gmail ignores them and inverts anyway, which is why the cream is
          tinted rather than near-white and the banner is genuinely dark —
          both survive inversion legibly.
        */}
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: color.creamDeep,
          fontFamily: font.serif,
        }}
      >
        <IssueLetter {...letter} />
      </Body>
    </Html>
  );
}
