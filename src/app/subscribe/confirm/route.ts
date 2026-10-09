import { after } from "next/server";
import { db } from "@/db/supabase";
import { notifyMax, onTheList } from "@/email/notify";
import { sendWelcome } from "@/email/welcome";

/**
 * The link in the confirmation email. Step two of double opt-in: the token
 * proves the address is real and its owner asked, so the subscriber goes from
 * pending to confirmed and lands on the homepage's "you're in".
 *
 * Only a pending subscriber can be confirmed. An old confirm link clicked
 * after unsubscribing must not quietly put someone back on the list.
 */
export async function GET(request: Request) {
  const back = (query: string) =>
    Response.redirect(new URL(`/${query}`, request.url), 303);

  const token = new URL(request.url).searchParams.get("token") ?? "";
  // Tokens are 32 random bytes as hex (see the first migration).
  if (!/^[0-9a-f]{64}$/.test(token)) return back("?error=1");

  try {
    const subscribers = db().from("subscribers");

    const { data: confirmed, error } = await subscribers
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("confirm_token", token)
      .eq("status", "pending")
      .select("id, email, unsubscribe_token, source");
    if (error) throw error;
    if (confirmed.length > 0) {
      const subscriber = confirmed[0];
      const origin = (process.env.SITE_URL ?? new URL(request.url).origin).replace(/\/$/, "");
      // After the redirect, so the new subscriber never waits on either.
      after(() => sendWelcome(subscriber, origin));
      after(() => notifyNewSubscriber(subscriber.email, subscriber.source));
      return back("?confirmed=1");
    }

    // Nothing pending under this token. Clicking the link twice, or a mail
    // scanner getting there first, should still read as success.
    const { data: row, error: lookupError } = await subscribers
      .select("status")
      .eq("confirm_token", token)
      .maybeSingle();
    if (lookupError) throw lookupError;
    return back(row?.status === "confirmed" ? "?confirmed=1" : "?error=1");
  } catch (error) {
    console.error("confirm failed:", error);
    return back("?error=1");
  }
}

/**
 * Tells Max someone new is on the list, and which link brought them (the
 * `?ref=` they arrived with, kept in `source`). Only on confirm, not on
 * signup, so typos and people who never click don't count.
 */
async function notifyNewSubscriber(email: string, source: string | null) {
  const via = source ? `, via ${source}` : "";
  await notifyMax(
    `New subscriber: ${email}`,
    `${email} just confirmed${via}${await onTheList()}.`,
  );
}
