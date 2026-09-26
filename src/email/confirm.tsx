import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
  render,
} from "@react-email/components";
import { color, font } from "@/design/tokens";
import { site } from "@/content/site";

interface ConfirmEmailProps {
  /** Absolute origin for the banner. Email cannot use relative URLs. */
  baseUrl: string;
  confirmUrl: string;
}

/**
 * The double opt-in email. Same banner and palette as an issue so the first
 * thing a new reader gets already looks like the letter, but none of the
 * issue's footer: nobody is subscribed yet, so there is nothing to leave.
 */
function ConfirmEmail({ baseUrl, confirmUrl }: ConfirmEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </Head>
      <Preview>One click and you&rsquo;re on the list.</Preview>
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
          <Section style={{ padding: 0 }}>
            <Img
              src={`${baseUrl}/brand/email-logo.jpg`}
              alt={site.name}
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

          <Section style={{ padding: "30px 24px 36px" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: font.display,
                fontSize: "30px",
                lineHeight: "33px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                color: color.ink,
              }}
            >
              Confirm your subscription
            </Text>
            <Text
              style={{
                margin: "18px 0 0",
                fontSize: "17px",
                lineHeight: "27px",
                color: color.ink,
              }}
            >
              Someone — hopefully you — asked to get {site.name}, a weekly
              letter about the music on my desk, every Sunday at {site.sendTime}.
              Click below and you&rsquo;re on the list.
            </Text>
            <Button
              href={confirmUrl}
              style={{
                marginTop: "22px",
                padding: "14px 24px",
                backgroundColor: color.orange,
                color: color.navy,
                fontFamily: font.display,
                fontSize: "14px",
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                textDecoration: "none",
              }}
            >
              Yes, sign me up
            </Button>
            <Text
              style={{
                margin: "26px 0 0",
                fontSize: "14px",
                lineHeight: "22px",
                color: color.inkMuted,
              }}
            >
              If you didn&rsquo;t ask for this, ignore it — nothing else will
              arrive. Questions? Just reply.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export async function renderConfirmEmail(props: ConfirmEmailProps) {
  const document = <ConfirmEmail {...props} />;
  const [html, text] = await Promise.all([
    render(document),
    render(document, { plainText: true }),
  ]);
  return { subject: `Confirm your subscription to ${site.name}`, html, text };
}
