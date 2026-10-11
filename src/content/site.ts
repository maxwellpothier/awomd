/**
 * The few facts about the sender that the site and the email both show.
 * Kept in one place so the inbox header, the letter footer, and the
 * unsubscribe stand-in never disagree about who this is from.
 */
export const site = {
  name: "A Week on My Desk",
  /** The public origin, for anything that leaves the site with an absolute URL. */
  url: "https://awomd.com",
  /** Replies land here via Namecheap forwarding (PLAN.md, Stack). */
  replyAddress: "max@awomd.com",
} as const;

/** Where the signup form posts. Double opt-in starts there. */
export const subscribeAction = "/api/subscribe";

/**
 * A signup field nobody can see or tab to. Bots fill in every field they
 * find; `/api/subscribe` quietly drops any post where this isn't empty.
 */
export const honeypotField = "leave_this_empty";

/** Carries the address from the form to "check your inbox", for ten minutes. */
export const signupEmailCookie = "awomd_signup_email";

/**
 * The `?ref=` a visitor first arrived with (an Instagram story, a card at a
 * record store, a forwarded issue), kept for 30 days by `src/proxy.ts` so a
 * signup a few pages later still knows where they came from. Saved on the
 * subscriber as `source`.
 */
export const refCookie = "awomd_ref";

/** A ref as it is stored: lowercase letters, digits, dashes, at most 40. */
export function cleanRef(value: string | null | undefined): string | null {
  const ref = (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return ref || null;
}

/**
 * Where the letter's Unsubscribe button goes on the site, where there is no
 * reader to take off: the page that explains the way off. In a sent email
 * it carries the reader's own token instead (the send and the email route).
 */
export const unsubscribeHref = "/unsubscribe";
