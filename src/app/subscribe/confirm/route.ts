import { after } from "next/server";
import { db } from "@/db/supabase";
import { resendRelay } from "@/email/relay";
import { site } from "@/content/site";

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
      .select("id, email");
    if (error) throw error;
    if (confirmed.length > 0) {
      // After the redirect, so the new subscriber never waits on it.
      after(() => notifyMax(confirmed[0].email));
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
 * Tells Max someone new is on the list. Only on confirm, not on signup, so
 * typos and people who never click don't count. A failure here is logged and
 * dropped: the subscriber is already confirmed.
 */
async function notifyMax(email: string) {
  try {
    const { count } = await db()
      .from("subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed");
    const total = count === null ? "" : ` (${count} on the list)`;
    const line = `${email} just confirmed${total}.`;

    const from = process.env.SEND_FROM;
    const apiKey = process.env.RESEND_API_KEY;
    if (!from || !apiKey) throw new Error("SEND_FROM and RESEND_API_KEY must be set");

    await resendRelay({ apiKey, from }).send({
      to: site.replyAddress,
      subject: `New subscriber: ${email}`,
      text: line,
      html: `<p>${escapeHtml(line)}</p>`,
    });
  } catch (error) {
    console.error("new-subscriber notice failed:", error);
  }
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
