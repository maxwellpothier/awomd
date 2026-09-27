import { db } from "@/db/supabase";

/**
 * Unsubscribe, by the token on the subscriber's row. The send puts it in
 * every email twice, and this handles both, plus the way back:
 *
 * - GET: the footer's Unsubscribe button. Off the list on the first click,
 *   no login, no "are you sure" (PLAN.md), then /unsubscribe says so and
 *   offers the undo. The undo also covers a mail scanner that follows every
 *   link in a message before its reader does.
 * - POST `List-Unsubscribe=One-Click`: the button Gmail and Apple Mail draw
 *   themselves, from the `List-Unsubscribe` header (RFC 8058). The client
 *   wants a 2xx, not a page.
 * - POST `undo=1`: the resubscribe button on /unsubscribe.
 */
export async function GET(request: Request) {
  const token = tokenFrom(request);
  const back = (query: string) =>
    Response.redirect(new URL(`/unsubscribe${query}`, request.url), 303);

  if (!token) return back("?error=1");
  try {
    return (await unsubscribe(token))
      ? back(`?done=1&token=${token}`)
      : back("?error=1");
  } catch (error) {
    console.error("unsubscribe failed:", error);
    return back("?error=1");
  }
}

export async function POST(request: Request) {
  const token = tokenFrom(request);
  const form = await request.formData().catch(() => new FormData());

  if (form.get("undo") === "1") {
    const back = (query: string) =>
      Response.redirect(new URL(`/unsubscribe${query}`, request.url), 303);
    if (!token) return back("?error=1");
    try {
      return (await resubscribe(token)) ? back("?resubscribed=1") : back("?error=1");
    } catch (error) {
      console.error("resubscribe failed:", error);
      return back("?error=1");
    }
  }

  if (!token) return new Response("Unknown unsubscribe link", { status: 404 });
  try {
    return (await unsubscribe(token))
      ? new Response("Unsubscribed", { status: 200 })
      : new Response("Unknown unsubscribe link", { status: 404 });
  } catch (error) {
    console.error("one-click unsubscribe failed:", error);
    return new Response("Unsubscribe failed", { status: 500 });
  }
}

/** Tokens are 32 random bytes as hex (see the first migration). */
function tokenFrom(request: Request): string | null {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  return /^[0-9a-f]{64}$/.test(token) ? token : null;
}

/**
 * Takes the subscriber off the list. True if the token is anyone's, even
 * someone already off it, so a second click still reads as done.
 */
async function unsubscribe(token: string): Promise<boolean> {
  const subscribers = db().from("subscribers");

  const { data: changed, error } = await subscribers
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .in("status", ["pending", "confirmed"])
    .select("id");
  if (error) throw error;
  if (changed.length > 0) return true;

  const { data: row, error: lookupError } = await subscribers
    .select("id")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (lookupError) throw lookupError;
  return row !== null;
}

/**
 * Puts them back. Only someone who once confirmed: an unsubscribe link must
 * not become a way round double opt-in.
 */
async function resubscribe(token: string): Promise<boolean> {
  const subscribers = db().from("subscribers");

  const { data: changed, error } = await subscribers
    .update({ status: "confirmed", unsubscribed_at: null })
    .eq("unsubscribe_token", token)
    .eq("status", "unsubscribed")
    .not("confirmed_at", "is", null)
    .select("id");
  if (error) throw error;
  if (changed.length > 0) return true;

  // Pressed twice: already back on.
  const { data: row, error: lookupError } = await subscribers
    .select("status")
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (lookupError) throw lookupError;
  return row?.status === "confirmed";
}
