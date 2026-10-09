import { after } from "next/server";
import { db } from "@/db/supabase";
import { notifyMax } from "@/email/notify";
import { resendWebhook, type RelayEvent } from "@/email/relay";

/**
 * The relay posts every delivery event here: sent, delivered, bounced,
 * complained, and opens and clicks when tracking is on. Each is stored raw in
 * `events`. Two change the list:
 *
 * - A permanent bounce marks the subscriber `bounced`, which the send skips
 *   and the signup form won't mail again. A dead address retried every
 *   Sunday is what costs a sender its reputation.
 * - A spam complaint unsubscribes them. They said they don't want it, and
 *   mailing them again tells Gmail the same thing louder. `unsubscribed`
 *   rather than `bounced`, because the address works and they can come back.
 *
 * Either one emails Max, who'll want to know.
 *
 * The relay retries anything that isn't a 2xx, so failures here return 5xx
 * and a retry is safe: the event insert is keyed on the relay's id, and the
 * status changes only move a subscriber who is still on the list.
 */
export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!apiKey || !secret) {
    console.error("relay webhook: RESEND_API_KEY and RESEND_WEBHOOK_SECRET must be set");
    return new Response("Not configured", { status: 500 });
  }

  let event: RelayEvent;
  try {
    event = resendWebhook({ apiKey, secret })(await request.text(), request.headers);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }

  try {
    const { subscriberId, issue } = await whoAndWhich(event);

    const { error: insertError } = await db().from("events").insert({
      subscriber_id: subscriberId,
      issue,
      type: event.type,
      link: event.link,
      occurred_at: event.occurredAt,
      relay_event_id: event.id || null,
      payload: event.payload,
    });
    // A retry of an event already stored. Carry on rather than return: if
    // the status change below failed last time, this is its second chance.
    if (insertError && insertError.code !== "23505") throw insertError;

    if (event.outcome && subscriberId) {
      const email = await takeOffList(subscriberId, event.outcome);
      if (email) after(() => tellMax(email, event, issue));
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(`relay webhook ${event.type} ${event.id} failed:`, error);
    return new Response("Failed", { status: 500 });
  }
}

/**
 * Which subscriber and issue an event is about. An issue's message id is on
 * its `sends` row. Mail that isn't an issue, like a confirmation email, has
 * no row, so it falls back to the address and has no issue.
 */
async function whoAndWhich(
  event: RelayEvent,
): Promise<{ subscriberId: string | null; issue: string | null }> {
  if (event.messageId) {
    const { data, error } = await db()
      .from("sends")
      .select("subscriber_id, issue")
      .eq("message_id", event.messageId)
      .maybeSingle();
    if (error) throw error;
    if (data) return { subscriberId: data.subscriber_id, issue: data.issue };
  }
  if (event.email) {
    const { data, error } = await db()
      .from("subscribers")
      .select("id")
      .eq("email", event.email)
      .maybeSingle();
    if (error) throw error;
    if (data) return { subscriberId: data.id, issue: null };
  }
  return { subscriberId: null, issue: null };
}

/**
 * Moves a subscriber off the list. Only from pending or confirmed: someone
 * already unsubscribed or bounced stays as they are. Returns their address
 * if this changed anything, so a retried webhook doesn't email Max twice.
 */
async function takeOffList(
  subscriberId: string,
  outcome: NonNullable<RelayEvent["outcome"]>,
): Promise<string | null> {
  const change =
    outcome === "bounced"
      ? { status: "bounced" }
      : { status: "unsubscribed", unsubscribed_at: new Date().toISOString() };
  const { data, error } = await db()
    .from("subscribers")
    .update(change)
    .eq("id", subscriberId)
    .in("status", ["pending", "confirmed"])
    .select("email");
  if (error) throw error;
  return data[0]?.email ?? null;
}

async function tellMax(email: string, event: RelayEvent, issue: string | null) {
  const on = issue ? ` on ${issue}` : "";
  if (event.outcome === "bounced") {
    const why = event.detail ? ` (${event.detail})` : "";
    await notifyMax(
      `Bounced: ${email}`,
      `${email} bounced${on}${why}. They're marked bounced and won't be sent to again.`,
    );
  } else {
    await notifyMax(
      `Marked as spam: ${email}`,
      `${email} reported the letter as spam${on}. They're unsubscribed.`,
    );
  }
}
