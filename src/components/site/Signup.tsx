import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { issueDateLabel, type IssueMeta } from "@/content/issues";
import { site } from "@/content/site";
import { paperCore, tear } from "@/design/tear";
import { SignupForm } from "./SignupForm";

/** Which step of double opt-in the visitor is on. Driven by the query string. */
export type SignupState = "form" | "sent" | "confirmed" | "error";

/**
 * The homepage: the signup form, and beside it the pile of issues so far,
 * the latest on top with its title and preview, so a visitor sees what
 * they're signing up for. The logo is the header's alone on this page (see
 * Header).
 *
 * This is the link that gets handed around, so the field is in the first
 * screen on a phone and a laptop alike; the preview sits below it on a phone.
 * The form posts to `subscribeAction`, and it and the confirm link redirect
 * back here with the step to show.
 */
export function Signup({
  state,
  email,
  issues,
}: {
  state: SignupState;
  /** The address just submitted, when known. Shown on "check your email". */
  email?: string;
  /** Newest first. */
  issues: IssueMeta[];
}) {
  const latest = issues.at(0);
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-8 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center lg:gap-20 lg:py-20">
      <div className="max-w-xl">
        {state === "form" ? <Form /> : null}
        {state === "sent" ? <Sent email={email} /> : null}
        {state === "confirmed" ? <Confirmed latest={latest} /> : null}
        {state === "error" ? <Failed /> : null}
      </div>
      <IssuePile issues={issues} />
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
    <h1 className="text-balance font-display text-[44px] leading-[1.08] sm:text-[64px]">
      <span className="highlight">{children}</span>
    </h1>
  );
}

function Lede({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 text-pretty text-lg leading-[1.6] sm:mt-6 sm:text-[19px] sm:leading-[1.65]">
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
      <Headline>Music worth passing along</Headline>
      <Lede>
        More people should share the music that moves them, so here&rsquo;s
        mine. Every Sunday evening I send out the albums and songs that stayed
        on my desk all week. Some of it will be strange, but that&rsquo;s the
        point.
      </Lede>

      <SignupForm />
    </>
  );
}

function Sent({ email }: { email?: string }) {
  return (
    <>
      <Headline>Check your email</Headline>
      {/* The address gets a line of its own so it never breaks mid-word
          across two. One too long for a line breaks after the @ if it can. */}
      <Lede>
        {email ? (
          <>
            I just sent a confirmation link to
            <strong className="block font-semibold [overflow-wrap:anywhere]">
              {email.split("@")[0]}@<wbr />
              {email.split("@").slice(1).join("@")}
            </strong>
          </>
        ) : (
          "I just sent a confirmation link. "
        )}
        Click it and you&rsquo;re on the list.
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
        The next issue goes out Sunday evening.
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

/** A sheet's torn bottom edge, as a clip-path. Each seed tears differently. */
function tornEdge(seed: number): string {
  const edge = tear(seed, (strength, random) => (random() - 0.5) * 4 * strength, 1.7).map(
    ({ t, y }) => `${(t * 100).toFixed(3)}% calc(100% - 7px + ${(y * 0.8).toFixed(2)}px)`,
  );
  return `polygon(0 0, 100% 0, ${edge.join(", ")})`;
}

/** The top sheet's edge. Its own seed, not the masthead's. */
const cardEdge = tornEdge(1987);

/**
 * Where each cover lies behind the card, as it would on a desk: tucked under
 * the sheet's top edge, peeking out, each at its own angle. On hover they
 * slide out a little further.
 */
const coverSpots = [
  "right-2 top-0 w-[150px] rotate-[8deg] group-hover:-translate-y-3 group-hover:rotate-[11deg]",
  "right-[128px] top-4 w-[136px] -rotate-[4deg] group-hover:-translate-y-2 group-hover:-rotate-[7deg]",
  "left-1 top-8 w-[124px] -rotate-[12deg] group-hover:-translate-y-2 group-hover:-rotate-[15deg]",
];

/** How many earlier issues show under the top sheet before the pile ends in a link. */
const pileDepth = 4;

/** How each earlier sheet lies under the one above: off to a side, at its own angle. */
const slipSpots = [
  "ml-5 mr-1 rotate-[1.2deg]",
  "ml-1 mr-6 -rotate-[0.9deg]",
  "ml-6 mr-2 rotate-[0.6deg]",
  "ml-2 mr-5 -rotate-[1.4deg]",
];

/**
 * The issues so far, as a pile of paper on the desk. The latest is the top
 * sheet: slightly askew, torn along the bottom like the letter's own
 * dividers, with a few of its records tucked under it. Earlier issues are
 * the sheets beneath, each sticking out below the one above with its number,
 * title and one record. Hovering straightens a sheet. Nothing before the
 * first send.
 */
function IssuePile({ issues }: { issues: IssueMeta[] }) {
  const [latest, ...earlier] = issues;
  if (!latest) return null;
  const covers = (latest.covers ?? []).slice(0, coverSpots.length);
  const slips = earlier.slice(0, pileDepth);

  return (
    <aside aria-label="Issues" className="mt-6 w-full max-w-[400px] lg:mt-0">
      {/* On a phone the card falls under the form; the label keeps it from
          reading as part of the signup. Beside the form it needs none. */}
      <div className="mb-5 flex items-center gap-4 lg:hidden">
        <h2 className="text-[19px] italic">Past issues</h2>
        <span aria-hidden className="h-px flex-1 bg-ink/20" />
      </div>
      <Link href={`/issues/${latest.slug}`} className="group relative z-10 block pt-24">
        {covers.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt=""
            width={300}
            height={300}
            sizes="150px"
            className={`absolute aspect-square object-cover shadow-[0_2px_8px_rgba(15,19,30,0.28)] motion-safe:transition-transform motion-safe:duration-300 ${coverSpots[i]}`}
          />
        ))}
        {/* The shadow is a filter on this wrapper: clip-path cuts a
            box-shadow off, and a filter follows the tear. */}
        <div className="relative -rotate-[1.5deg] drop-shadow-[0_3px_6px_rgba(15,19,30,0.22)] motion-safe:transition-transform motion-safe:duration-300 group-hover:rotate-0 group-hover:-translate-y-1">
          <div
            className="px-7 pb-9 pt-7"
            style={{ background: paperCore, clipPath: cardEdge }}
          >
            <p className="text-sm text-ink-muted">
              Issue {latest.number} · {issueDateLabel(latest.date)}
            </p>
            <p className="mt-2 text-balance font-display text-[30px] leading-[1.1]">
              {latest.title}
            </p>
            <p className="mt-3 line-clamp-3 text-[15px] leading-6 text-ink-muted">
              {latest.preview}
            </p>
            <p className="mt-5 text-[15px] font-medium underline decoration-ink/30 underline-offset-[3px] group-hover:decoration-ink">
              Read this issue
              <span aria-hidden className="ml-1.5 inline-block motion-safe:transition-transform group-hover:translate-x-1">
                →
              </span>
            </p>
          </div>
        </div>
      </Link>
      {slips.length > 0 ? (
        <ol>
          {slips.map((issue, i) => (
            // Each sheet starts under the torn edge of the one above it.
            <li key={issue.slug} className="relative -mt-3" style={{ zIndex: 9 - i }}>
              <IssueSlip issue={issue} spot={slipSpots[i % slipSpots.length]} />
            </li>
          ))}
        </ol>
      ) : null}
      {earlier.length > slips.length ? (
        <p className="mt-6 text-center text-[15px]">
          <Link href="/issues" className={textLink}>
            All {issues.length} issues
          </Link>
        </p>
      ) : null}
    </aside>
  );
}

/** An earlier issue: a sheet lower in the pile, showing only its bottom strip. */
function IssueSlip({ issue, spot }: { issue: IssueMeta; spot: string }) {
  const cover = issue.covers?.at(0);

  return (
    <Link href={`/issues/${issue.slug}`} className="group block">
      <div
        className={`drop-shadow-[0_3px_6px_rgba(15,19,30,0.22)] motion-safe:transition-transform motion-safe:duration-300 group-hover:translate-y-1 group-hover:rotate-0 ${spot}`}
      >
        <div
          className="flex items-center gap-4 px-6 pb-6 pt-7"
          style={{ background: paperCore, clipPath: tornEdge(Number(issue.number) + 2000) }}
        >
          {cover ? (
            <Image
              src={cover}
              alt=""
              width={300}
              height={300}
              sizes="56px"
              className="aspect-square w-14 shrink-0 -rotate-[4deg] object-cover shadow-[0_1px_4px_rgba(15,19,30,0.28)] motion-safe:transition-transform motion-safe:duration-300 group-hover:-rotate-[8deg]"
            />
          ) : null}
          <div className="min-w-0">
            <p className="text-sm text-ink-muted">
              Issue {issue.number} · {issueDateLabel(issue.date)}
            </p>
            <p className="mt-1 text-balance font-display text-[21px] leading-[1.15]">
              {issue.title}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
