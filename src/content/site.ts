/**
 * The few facts about the sender that the site and the email both show.
 * Kept in one place so the inbox header, the letter footer, and the
 * unsubscribe stand-in never disagree about who this is from.
 */
export const site = {
  name: "A Week on My Desk",
  /** Replies land here via Namecheap forwarding (PLAN.md, Stack). */
  replyAddress: "max@awomd.com",
} as const;

/** Where the signup form posts. Double opt-in starts there. */
export const subscribeAction = "/api/subscribe";

/** Carries the address from the form to "check your inbox", for ten minutes. */
export const signupEmailCookie = "awomd_signup_email";

/**
 * Where the letter's Unsubscribe button goes on the site, where there is no
 * reader to take off: the page that explains the way off. In a sent email
 * it carries the reader's own token instead (the send and the email route).
 */
export const unsubscribeHref = "/unsubscribe";
