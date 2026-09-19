import {
  Body,
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
import { color, font } from "@/design/tokens";

export interface IssueEmailProps {
  title: string;
  dateLabel: string;
  issueNumber: string;
  /** First line shown in the inbox list, before the reader opens it. */
  preview: string;
  baseUrl: string;
  /** Permalink for "read in browser". */
  permalink: string;
  /** Replaced per recipient at send time. */
  unsubscribeUrl: string;
  children: ReactNode;
}

export function IssueEmail({
  title,
  dateLabel,
  issueNumber,
  preview,
  baseUrl,
  permalink,
  unsubscribeUrl,
  children,
}: IssueEmailProps) {
  const logo = `${baseUrl.replace(/\/$/, "")}/brand/email-logo.jpg`;

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
            cell. The navy and its texture are baked into the JPEG, so there is
            no seam to match, and a client that force-inverts backgrounds in
            dark mode cannot strand the wordmark on the wrong ground.
          */}
          <Section style={{ padding: 0 }}>
            <Img
              src={logo}
              alt="A Week on My Desk"
              width="600"
              height="306"
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
            style={{ backgroundColor: color.orange, height: "4px", lineHeight: "4px" }}
          />

          <Section style={{ padding: "30px 24px 8px" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: font.display,
                fontSize: "11px",
                letterSpacing: "1.8px",
                textTransform: "uppercase",
                color: color.orangeDeep,
              }}
            >
              Issue {issueNumber} · {dateLabel}
            </Text>
            <Text
              style={{
                margin: "10px 0 0",
                fontFamily: font.display,
                fontSize: "30px",
                lineHeight: "33px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                color: color.ink,
              }}
            >
              {title}
            </Text>
          </Section>

          <Section style={{ padding: "8px 24px 36px" }}>{children}</Section>

          {/* Footer. Unsubscribe works on first click, no login, no
              confirmation page. Postal address is deferred per PLAN.md. */}
          <Section
            style={{
              backgroundColor: color.navy,
              padding: "26px 24px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: font.serif,
                fontSize: "14px",
                lineHeight: "22px",
                color: color.cream,
              }}
            >
              Just hit reply — I read everything, and recommendations back are
              the whole point.
            </Text>
            <Text
              style={{
                margin: "14px 0 0",
                fontFamily: font.display,
                fontSize: "11px",
                letterSpacing: "1.4px",
                textTransform: "uppercase",
              }}
            >
              <Link href={permalink} style={{ color: color.cream }}>
                Read in browser
              </Link>
              <span style={{ color: color.cream, opacity: 0.4 }}>{"   ·   "}</span>
              <Link href={unsubscribeUrl} style={{ color: color.cream }}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
