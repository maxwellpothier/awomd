/**
 * The few facts about the sender that the site and the email both show.
 * Kept in one place so the inbox header, the letter footer, and the
 * unsubscribe stand-in never disagree about who this is from.
 */
export const site = {
  name: "A Week on My Desk",
  /** Replies land here via Namecheap forwarding (PLAN.md, Stack). */
  replyAddress: "max@awomd.com",
  /** The schedule, as shown next to the date in the reading pane. */
  sendTime: "4:00 PM",
} as const;

/**
 * Where the signup form posts. Not wired up yet: the route handler, the
 * subscribers table, and the confirmation email are build-order step 8 in
 * PLAN.md.
 */
export const subscribeAction = "/api/subscribe";

/**
 * Mailto unsubscribe, the same stand-in the send command uses until
 * per-recipient tokens exist. See PLAN.md, "Standing in for deferred pieces".
 */
export const unsubscribeHref = `mailto:${site.replyAddress}?subject=unsubscribe`;
