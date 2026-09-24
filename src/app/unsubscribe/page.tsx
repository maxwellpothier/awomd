import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Stop receiving A Week on My Desk.",
  // Nothing here should ever land in a search result.
  robots: { index: false, follow: false },
};

/**
 * Unsubscribe.
 *
 * Until the subscribers table lands there are no per-recipient tokens, so this
 * page cannot unsubscribe anyone by itself — the list is a flat file and the
 * only way off it is to tell Max. That makes this an instruction page, not an
 * action page, and it says so plainly rather than showing a button that would
 * have to lie about what it did.
 *
 * When Supabase lands: read `?token=`, remove that subscriber, and this becomes
 * a confirmation. The URL in the email footer already points here, so that
 * change is this file plus the token lookup — the email does not move.
 */
export default function UnsubscribePage() {
  const mailto =
    "mailto:max@awomd.com" +
    "?subject=" +
    encodeURIComponent("Unsubscribe") +
    "&body=" +
    encodeURIComponent(
      "Please take me off the list. (No need to write anything else — " +
        "sending this is enough.)",
    );

  return (
    <div className="mx-auto max-w-2xl px-6 py-14 sm:py-20">
      <h1 className="font-display text-4xl uppercase leading-none tracking-[0.01em] sm:text-5xl">
        Unsubscribe
      </h1>
      <div className="mt-4 h-0.5 w-16 bg-orange" aria-hidden />

      <div className="mt-10 space-y-5 text-lg leading-8">
        <p>
          The list is small enough that it is still kept by hand, so there is no
          button here that can do it for you. Send one email and you are off it
          — no reply needed, no confirmation step.
        </p>
        <p>
          <a
            href={mailto}
            className="font-display uppercase tracking-[0.08em] text-orange underline underline-offset-4"
          >
            Email max@awomd.com to unsubscribe
          </a>
        </p>
        <p className="text-base text-ink-muted">
          If that link does not open your mail app, write to{" "}
          <span className="whitespace-nowrap">max@awomd.com</span> from the
          address you receive the newsletter at. Replying to any issue works
          just as well.
        </p>
      </div>
    </div>
  );
}
