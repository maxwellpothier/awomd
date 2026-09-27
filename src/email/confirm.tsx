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
import { color, displayWeight, font } from "@/design/tokens";
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
      <Preview>Confirm your email to start getting it on Sundays.</Preview>
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
              // The letter's torn banner (see IssueEmail), so the first
              // email a subscriber gets opens the way every issue does.
              src={`${baseUrl}/brand/email-banner.png`}
              alt={site.name}
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

          <Section style={{ padding: "30px 24px 36px" }}>
            <Text
              style={{
                margin: 0,
                fontFamily: font.display,
                fontWeight: displayWeight,
                fontSize: "30px",
                lineHeight: "36px",
                color: color.ink,
              }}
            >
              Confirm your email
            </Text>
            <Text
              style={{
                margin: "18px 0 0",
                fontSize: "17px",
                lineHeight: "27px",
                color: color.ink,
              }}
            >
              Thanks for signing up for {site.name}. Click the button below
              and the next issue will land in your inbox on Sunday at{" "}
              {site.sendTime}.
            </Text>
            <Button
              href={confirmUrl}
              style={{
                marginTop: "22px",
                padding: "14px 24px",
                backgroundColor: color.navy,
                color: color.cream,
                fontFamily: font.serif,
                fontSize: "17px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Confirm my email
            </Button>
            <Text
              style={{
                margin: "26px 0 0",
                fontSize: "14px",
                lineHeight: "22px",
                color: color.inkMuted,
              }}
            >
              If you didn&rsquo;t sign up, you can ignore this and you
              won&rsquo;t hear from me again.
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
  return { subject: `Confirm your email for ${site.name}`, html, text };
}
