import { site, subscribeAction } from "@/content/site";

/** Which step of double opt-in the visitor is on. Driven by the query string. */
export type SubscribeState = "form" | "sent" | "confirmed";

/**
 * The subscribe page, dressed as a letter: same banner, same cream column,
 * same navy footer as an issue, so it sits in the reading pane without
 * looking like a different site.
 *
 * This is site UI, not a content block, so it may use the web freely. The
 * form itself is unwired — see `subscribeAction` — and the three states are
 * here so wiring it later is a route handler, not a redesign.
 */
export function SubscribeLetter({ state }: { state: SubscribeState }) {
  return (
    <div className="bg-cream shadow-[0_1px_3px_rgba(15,19,30,0.10),0_8px_28px_-12px_rgba(15,19,30,0.18)]">
      {/* eslint-disable-next-line @next/next/no-img-element -- same JPEG the email uses, at its native size */}
      <img
        src="/brand/email-logo.jpg"
        alt="A Week on My Desk"
        width={600}
        height={306}
        className="block h-auto w-full"
      />
      <div className="h-1 bg-orange" aria-hidden />

      <div className="px-6 pb-9 pt-8 sm:px-8">
        {state === "form" ? <Pitch /> : null}
        {state === "sent" ? <Sent /> : null}
        {state === "confirmed" ? <Confirmed /> : null}
      </div>

      <div className="bg-navy px-6 py-6 text-center text-sm leading-6 text-cream">
        Friends and family first. Unsubscribe is one click, at the bottom of
        every issue.
      </div>
    </div>
  );
}

function Pitch() {
  return (
    <>
      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-orange-deep">
        Sundays · {site.sendTime}
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase leading-[0.95] tracking-[0.01em]">
        A weekly letter about the music on my desk
      </h2>
      <div className="mt-6 space-y-4 text-[17px] leading-7">
        <p>
          Albums, tracks, and the occasional documentary or book, with notes on
          why each one stuck. One email a week, no more.
        </p>
        <p>
          Replies are the point. The whole reason this exists is to get
          recommendations back, so hit reply on anything.
        </p>
      </div>

      <form
        action={subscribeAction}
        method="post"
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <label className="sr-only" htmlFor="subscribe-email">
          Email address
        </label>
        <input
          id="subscribe-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-sm border border-navy/25 bg-cream px-4 py-3 text-base text-ink placeholder:text-ink-muted/70 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/30"
        />
        <button
          type="submit"
          className="rounded-sm bg-orange px-5 py-3 font-display text-sm uppercase tracking-[0.18em] text-navy transition-colors hover:bg-navy hover:text-cream"
        >
          Subscribe
        </button>
      </form>
      <p className="mt-3 text-sm text-ink-muted">
        You&rsquo;ll get one email asking you to confirm. Nothing arrives until you
        click it.
      </p>
    </>
  );
}

function Sent() {
  return (
    <>
      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-orange-deep">
        One more step
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase leading-[0.95] tracking-[0.01em]">
        Check your inbox
      </h2>
      <p className="mt-6 text-[17px] leading-7">
        A confirmation email is on its way. Click the link in it and you&rsquo;re on
        the list. If it doesn&rsquo;t show up in a few minutes, check spam, then{" "}
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
      <p className="font-display text-[11px] uppercase tracking-[0.22em] text-orange-deep">
        Done
      </p>
      <h2 className="mt-3 font-display text-3xl uppercase leading-[0.95] tracking-[0.01em]">
        You&rsquo;re in
      </h2>
      <p className="mt-6 text-[17px] leading-7">
        The next issue lands on Sunday at {site.sendTime}. Until then, the inbox
        has everything that&rsquo;s gone out so far.
      </p>
    </>
  );
}
