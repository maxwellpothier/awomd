import type { Metadata } from "next";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Stop receiving A Week on My Desk.",
  // Nothing here should ever land in a search result.
  robots: { index: false, follow: false },
};

/**
 * Unsubscribe.
 *
 * Until the send reads from the subscribers table there are no per-recipient
 * tokens, so this page cannot unsubscribe anyone by itself — the list is a
 * flat file and the only way off it is to tell Max. That makes this an
 * instruction page, not an action page, and it says so plainly rather than
 * showing a button that would have to lie about what it did.
 *
 * When tokens land: read `?token=`, remove that subscriber, and this becomes
 * a confirmation. The URL in the email footer already points here, so that
 * change is this file plus the token lookup — the email does not move.
 */
export default function UnsubscribePage() {
  const mailto =
    `mailto:${site.replyAddress}` +
    "?subject=" +
    encodeURIComponent("Unsubscribe") +
    "&body=" +
    encodeURIComponent("Please take me off the list.");

  return (
    <article className="mx-auto max-w-[640px] px-6 py-14 sm:px-8 sm:py-20">
      <h1 className="font-display text-[44px] leading-[1.08] sm:text-[64px]">
        Unsubscribe
      </h1>

      <div className="mt-8 space-y-6 text-[19px] leading-[1.65]">
        <p>
          The list is still small enough that I manage it myself. Send me an
          email and I&rsquo;ll take you off. Replying to any issue works too.
        </p>
        <p>
          <a
            href={mailto}
            className="inline-block rounded-[3px] bg-navy px-6 py-3 text-[17px] font-medium text-cream transition-colors hover:bg-navy-soft"
          >
            Email me to unsubscribe
          </a>
        </p>
        <p className="text-base leading-7 text-ink-muted">
          If that button doesn&rsquo;t open your mail app, write to{" "}
          <span className="whitespace-nowrap">{site.replyAddress}</span> from
          the address you get the newsletter at.
        </p>
      </div>
    </article>
  );
}
