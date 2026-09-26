import { db } from "@/db/supabase";
import { renderConfirmEmail } from "@/email/confirm";
import { resendRelay } from "@/email/relay";

/**
 * The signup form posts here. Step one of double opt-in: record the address as
 * pending and email it a confirm link. Nobody is on the list until they click.
 *
 * A plain form post, not fetch, so it works without JavaScript; every outcome
 * is a 303 back to the homepage, which shows the matching step.
 */
export async function POST(request: Request) {
  const back = (query: string) =>
    Response.redirect(new URL(`/${query}`, request.url), 303);

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();
  // The input is type="email", so a browser has already checked it. This
  // only turns away hand-rolled posts.
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return back("");
  }

  try {
    const subscribers = db().from("subscribers");

    // Insert if new. A second signup for the same address, in any case, is a
    // no-op here (citext + unique) rather than an error.
    const inserted = await subscribers.upsert(
      { email, source: "site" },
      { onConflict: "email", ignoreDuplicates: true },
    );
    if (inserted.error) throw inserted.error;

    const { data: row, error } = await subscribers
      .select("id, status, confirm_token")
      .eq("email", email)
      .single();
    if (error) throw error;

    // Confirmed and bounced addresses get no email, but the visitor sees the
    // same "check your inbox" as everyone else: the page never reveals who is
    // already on the list.
    if (row.status === "confirmed" || row.status === "bounced") {
      return back("?sent=1");
    }

    // Someone who unsubscribed and signs up again goes back through opt-in.
    if (row.status === "unsubscribed") {
      const reset = await subscribers
        .update({ status: "pending" })
        .eq("id", row.id);
      if (reset.error) throw reset.error;
    }

    const origin = (process.env.SITE_URL ?? new URL(request.url).origin).replace(
      /\/$/,
      "",
    );
    const message = await renderConfirmEmail({
      baseUrl: origin,
      confirmUrl: `${origin}/subscribe/confirm?token=${row.confirm_token}`,
    });

    const relay = resendRelay({
      apiKey: required("RESEND_API_KEY"),
      from: required("SEND_FROM"),
      replyTo: process.env.SEND_REPLY_TO,
    });
    await relay.send({ to: email, ...message });

    return back("?sent=1");
  } catch (error) {
    console.error("subscribe failed:", error);
    return back("?error=1");
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}
