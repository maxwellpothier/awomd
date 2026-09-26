import { db } from "@/db/supabase";

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
      .select("id");
    if (error) throw error;
    if (confirmed.length > 0) return back("?confirmed=1");

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
