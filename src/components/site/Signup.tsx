import Link from "next/link";
import type { ReactNode } from "react";
import { issueDateLabel, type IssueMeta } from "@/content/issues";
import { site } from "@/content/site";
import { SignupForm } from "./SignupForm";

/** Which step of double opt-in the visitor is on. Driven by the query string. */
export type SignupState = "form" | "sent" | "confirmed" | "error";

/**
 * The homepage: the signup form, and beside it the latest issue's title and
 * preview, so a visitor sees what they're signing up for. The logo is the
 * header's alone on this page (see Header).
 *
 * This is the link that gets handed around, so the field is in the first
 * screen on a phone and a laptop alike; the preview sits below it on a phone.
 * The form posts to `subscribeAction`, and it and the confirm link redirect
 * back here with the step to show.
 */
export function Signup({
  state,
  email,
  latest,
}: {
  state: SignupState;
  /** The address just submitted, when known. Shown on "check your email". */
  email?: string;
  latest?: IssueMeta;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-8 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center lg:gap-20 lg:py-20">
      <div className="max-w-xl">
        {state === "form" ? <Form /> : null}
        {state === "sent" ? <Sent email={email} /> : null}
        {state === "confirmed" ? <Confirmed latest={latest} /> : null}
        {state === "error" ? <Failed /> : null}
      </div>
      <LatestIssue latest={latest} />
    </div>
  );
}

/**
 * The homepage headline, highlighted (`.highlight` in globals.css). The
 * highlight sits on an inner span, not the h1, so it follows each wrapped
 * line instead of filling the block.
 */
function Headline({ children }: { children: ReactNode }) {
  return (
    <h1 className="font-display text-[44px] leading-[1.08] sm:text-[64px]">
      <span className="highlight">{children}</span>
    </h1>
  );
}

function Lede({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 text-lg leading-[1.6] sm:mt-6 sm:text-[19px] sm:leading-[1.65]">
      {children}
    </p>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-base leading-7 text-ink-muted">{children}</p>;
}

const textLink =
  "underline decoration-ink/30 underline-offset-[3px] transition-colors hover:text-orange-deep hover:decoration-orange-deep";

function MailMe({ subject }: { subject: string }) {
  return (
    <a
      href={`mailto:${site.replyAddress}?subject=${encodeURIComponent(subject)}`}
      className={textLink}
    >
      {site.replyAddress}
    </a>
  );
}

function Form() {
  return (
    <>
      <Headline>Music I can&rsquo;t stop playing, every Sunday</Headline>
      <Lede>
        I&rsquo;m Max. Once a week I write about the albums and songs I&rsquo;ve
        had on repeat, plus the odd documentary or book, and send it out Sunday
        at {site.sendTime}. It&rsquo;s mostly for friends and family, and my
        favorite part is when someone writes back with something for me to hear.
      </Lede>

      <SignupForm />
    </>
  );
}

function Sent({ email }: { email?: string }) {
  return (
    <>
      <Headline>Check your email</Headline>
      <Lede>
        I just sent a confirmation link
        {email ? (
          <>
            {" "}
            to <strong className="break-all font-semibold">{email}</strong>
          </>
        ) : null}
        . Click it and you&rsquo;re on the list.
      </Lede>
      <Note>
        Nothing after a few minutes? Check your spam folder, or email me at{" "}
        <MailMe subject="Subscribe" />.
        {email ? (
          <>
            {" "}
            Wrong address?{" "}
            <Link href="/" className={textLink}>
              Try again
            </Link>
            .
          </>
        ) : null}
      </Note>
    </>
  );
}

function Confirmed({ latest }: { latest?: IssueMeta }) {
  return (
    <>
      <Headline>You&rsquo;re on the list</Headline>
      <Lede>
        The next issue goes out Sunday at {site.sendTime}.
        {latest ? (
          <>
            {" "}
            If you can&rsquo;t wait,{" "}
            <Link href={`/issues/${latest.slug}`} className={textLink}>
              the latest one is here
            </Link>
            .
          </>
        ) : null}
      </Lede>
    </>
  );
}

function Failed() {
  return (
    <>
      <Headline>Something went wrong</Headline>
      <Lede>
        Either the confirmation email didn&rsquo;t send or that link has
        expired.{" "}
        <Link href="/" className={textLink}>
          Try again
        </Link>
        , or email me at <MailMe subject="Subscribe" /> and I&rsquo;ll add you
        myself.
      </Lede>
    </>
  );
}

/**
 * The latest issue as a card: issue line, title, preview. Nothing before the
 * first send.
 */
function LatestIssue({ latest }: { latest?: IssueMeta }) {
  if (!latest) return null;

  return (
    <aside aria-label="Latest issue" className="w-full max-w-[400px]">
      <Link href={`/issues/${latest.slug}`} className="group block">
        <div className="overflow-hidden bg-cream shadow-[0_1px_3px_rgba(15,19,30,0.10),0_12px_32px_-12px_rgba(15,19,30,0.25)]">
          <div className="h-1 bg-orange" aria-hidden />
          <div className="px-6 pb-7 pt-6">
            <p className="text-sm text-ink-muted">
              Issue {latest.number} · {issueDateLabel(latest.date)}
            </p>
            <p className="mt-2 font-display text-[28px] leading-[1.15]">
              {latest.title}
            </p>
            <p className="mt-3 line-clamp-3 text-[15px] leading-6 text-ink-muted">
              {latest.preview}
            </p>
            <p className="mt-4 text-[15px] font-medium text-orange-deep group-hover:underline">
              Read this issue
            </p>
          </div>
        </div>
      </Link>
    </aside>
  );
}
