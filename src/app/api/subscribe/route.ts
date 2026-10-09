import { cookies } from "next/headers";
import { db } from "@/db/supabase";
import { renderConfirmEmail } from "@/email/confirm";
import { resendRelay } from "@/email/relay";
import { cleanRef, honeypotField, refCookie, signupEmailCookie } from "@/content/site";

/**
 * How long one address waits between confirmation emails. Without it anyone
 * could make the form mail a stranger over and over, and their spam reports
 * would land on awomd.com. A real person who asks twice in a row still sees
 * "check your email": the first one is still good.
 */
const confirmCooldownMinutes = 10;

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

  // "Check your inbox" names the address it went to, so a typo like
  // gmail.con is caught on the spot rather than by a silent inbox. A short
  // cookie rather than the query string keeps the address out of browser
  // history and request logs.
  const sent = () => {
    const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
    return new Response(null, {
      status: 303,
      headers: {
        Location: new URL("/?sent=1", request.url).toString(),
        "Set-Cookie": `${signupEmailCookie}=${encodeURIComponent(email)}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax${secure}`,
      },
    });
  };

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim();

  // A field people never see (SignupForm). Anything in it was typed by a
  // bot, which gets the same "check your email" as everyone and nothing else.
  if (String(form.get(honeypotField) ?? "") !== "") return sent();

  // The input is type="email", so a browser has already checked it. This
  // only turns away hand-rolled posts.
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return back("");
  }

  try {
    const subscribers = db().from("subscribers");

    // Where they came from, if they arrived on a `?ref=` link (src/proxy.ts).
    const ref = cleanRef((await cookies()).get(refCookie)?.value);

    // Insert if new. A second signup for the same address, in any case, is a
    // no-op here (citext + unique) rather than an error, and keeps the source
    // it first came in with.
    const inserted = await subscribers.upsert(
      { email, source: ref ? `site:${ref}` : "site" },
      { onConflict: "email", ignoreDuplicates: true },
    );
    if (inserted.error) throw inserted.error;

    const { data: row, error } = await subscribers
      .select("id, status, confirm_token, confirm_sent_at")
      .eq("email", email)
      .single();
    if (error) throw error;

    // Confirmed and bounced addresses get no email, but the visitor sees the
    // same "check your inbox" as everyone else: the page never reveals who is
    // already on the list.
    if (row.status === "confirmed" || row.status === "bounced") {
      return sent();
    }

    // Someone who unsubscribed and signs up again goes back through opt-in.
    if (row.status === "unsubscribed") {
      const reset = await subscribers
        .update({ status: "pending" })
        .eq("id", row.id);
      if (reset.error) throw reset.error;
    }

    // Claim this address's next confirmation email, in one statement so two
    // posts at once can't both send. Nothing to claim means one went out in
    // the last few minutes.
    const cutoff = new Date(Date.now() - confirmCooldownMinutes * 60_000).toISOString();
    const { data: claimed, error: claimError } = await subscribers
      .update({ confirm_sent_at: new Date().toISOString() })
      .eq("id", row.id)
      .or(`confirm_sent_at.is.null,confirm_sent_at.lt."${cutoff}"`)
      .select("id");
    if (claimError) throw claimError;
    if (claimed.length === 0) return sent();

    try {
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
    } catch (error) {
      // Nothing went out, so a retry shouldn't have to wait out the cooldown.
      await subscribers.update({ confirm_sent_at: row.confirm_sent_at }).eq("id", row.id);
      throw error;
    }

    return sent();
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
