import Link from "next/link";
import type { ReactNode } from "react";
import { site, subscribeAction } from "@/content/site";

/** Which step of double opt-in the visitor is on. Driven by the query string. */
export type SignupState = "form" | "sent" | "confirmed";

/**
 * The homepage: a signup form and nothing competing with it.
 *
 * This is the link that gets handed around, so the field is in the first
 * screen on a phone and a laptop alike. The form is unwired — see
 * `subscribeAction` — and the three states are here so wiring it later is a
 * route handler, not a redesign.
 */
export function Signup({ state }: { state: SignupState }) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-var(--header-h))] max-w-xl flex-col justify-center px-6 py-16 sm:py-20">
      {state === "form" ? <Form /> : null}
      {state === "sent" ? <Sent /> : null}
      {state === "confirmed" ? <Confirmed /> : null}

      <p className="mt-14 flex flex-wrap gap-x-5 gap-y-2 font-display text-[11px] uppercase tracking-[0.2em] text-ink-muted">
        <Link href="/issues" className="hover:text-orange">
          Read past issues →
        </Link>
        <Link href="/about" className="hover:text-orange">
          About
        </Link>
      </p>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-display text-[11px] uppercase tracking-[0.22em] text-orange-deep">
      {children}
    </p>
  );
}

function Headline({ children }: { children: ReactNode }) {
  return (
    <h1 className="mt-4 font-display text-5xl uppercase leading-[0.92] tracking-[0.01em] sm:text-6xl">
      {children}
    </h1>
  );
}

function Form() {
  return (
    <>
      <Eyebrow>Sundays · {site.sendTime}</Eyebrow>
      <Headline>A weekly letter about the music on my desk</Headline>
      <div className="mt-5 h-0.5 w-16 bg-orange" aria-hidden />
      <p className="mt-7 max-w-md text-lg leading-8">
        Albums, tracks, and the occasional documentary or book, with notes on
        why each one stuck. One email a week. Replies are the point.
      </p>

      <form
        action={subscribeAction}
        method="post"
        className="mt-9 flex flex-col gap-3 sm:flex-row"
      >
        <label className="sr-only" htmlFor="signup-email">
          Email address
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-sm border border-navy/25 bg-cream px-4 py-3.5 text-base text-ink placeholder:text-ink-muted/70 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/30"
        />
        <button
          type="submit"
          className="rounded-sm bg-orange px-6 py-3.5 font-display text-sm uppercase tracking-[0.18em] text-navy transition-colors hover:bg-navy hover:text-cream"
        >
          Subscribe
        </button>
      </form>
      <p className="mt-3 text-sm text-ink-muted">
        You&rsquo;ll get one email asking you to confirm. Nothing arrives until
        you click it, and unsubscribe is one click at the bottom of every issue.
      </p>
    </>
  );
}

function Sent() {
  return (
    <>
      <Eyebrow>One more step</Eyebrow>
      <Headline>Check your inbox</Headline>
      <div className="mt-5 h-0.5 w-16 bg-orange" aria-hidden />
      <p className="mt-7 max-w-md text-lg leading-8">
        A confirmation email is on its way. Click the link in it and
        you&rsquo;re on the list. If it doesn&rsquo;t show up in a few minutes,
        check spam, then{" "}
        <a
          href={`mailto:${site.replyAddress}?subject=Subscribe`}
          className="underline decoration-orange/40 underline-offset-4 hover:text-orange"
        >
          just write to me
        </a>
        .
      </p>
    </>
  );
}

function Confirmed() {
  return (
    <>
      <Eyebrow>Done</Eyebrow>
      <Headline>You&rsquo;re in</Headline>
      <div className="mt-5 h-0.5 w-16 bg-orange" aria-hidden />
      <p className="mt-7 max-w-md text-lg leading-8">
        The next issue lands on Sunday at {site.sendTime}. Until then, the
        inbox has everything that&rsquo;s gone out so far.
      </p>
    </>
  );
}
