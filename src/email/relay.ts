import { Resend } from "resend";

/**
 * The email relay, behind an adapter.
 *
 * PLAN.md: "own the content and the list, rent delivery — the email relay is a
 * config value." That only holds if nothing outside this file knows which
 * relay we use. Swapping to Postmark or SES is a new implementation of
 * `Relay`, not a migration.
 */
export interface Outgoing {
  to: string;
  subject: string;
  html: string;
  text: string;
  /**
   * How this recipient stops receiving mail. Gmail and Apple Mail surface it
   * as a one-click button above the message. Every issue carries one; a
   * confirmation email does not, because its recipient isn't on the list yet.
   */
  unsubscribe?: { mailto?: string; url?: string };
}

export interface SendResult {
  /** The relay's id, stored so a send can be traced back later. */
  messageId: string;
}

export interface Relay {
  readonly name: string;
  send(message: Outgoing): Promise<SendResult>;
}

function unsubscribeHeaders(unsubscribe: Outgoing["unsubscribe"]) {
  if (!unsubscribe) return {};
  const parts = [
    unsubscribe.url ? `<${unsubscribe.url}>` : null,
    unsubscribe.mailto ? `<mailto:${unsubscribe.mailto}>` : null,
  ].filter(Boolean);
  if (parts.length === 0) return {};

  const headers: Record<string, string> = {
    "List-Unsubscribe": parts.join(", "),
  };
  // One-click only works against an HTTPS endpoint — a mailto unsubscribe
  // still renders as a button, but the client sends mail instead of POSTing.
  if (unsubscribe.url) {
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  return headers;
}

export function resendRelay(options: {
  apiKey: string;
  from: string;
  replyTo?: string;
}): Relay {
  const client = new Resend(options.apiKey);
  return {
    name: "resend",
    async send(message) {
      const { data, error } = await client.emails.send({
        from: options.from,
        to: message.to,
        replyTo: options.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
        headers: unsubscribeHeaders(message.unsubscribe),
      });
      if (error) throw new Error(`${error.name}: ${error.message}`);
      if (!data) throw new Error("relay returned no message id");
      return { messageId: data.id };
    },
  };
}

/** Prints instead of sending. What `--dry-run` uses. */
export function consoleRelay(): Relay {
  return {
    name: "console",
    async send(message) {
      console.log(`    [dry run] would send to ${message.to}`);
      return { messageId: `dry-${Date.now()}` };
    },
  };
}

/**
 * A relay webhook, reduced to what we act on. The route stores `payload`
 * untouched in `events` and decides from the rest, so it never learns the
 * relay's vocabulary.
 */
export interface RelayEvent {
  /** The relay's id for this delivery. Retries repeat it. */
  id: string;
  /** The relay's own name for what happened, stored as-is. */
  type: string;
  /**
   * What the event means for the list. `bounced` is a permanent failure: the
   * address is dead. `complained` is the reader marking it as spam. A soft
   * bounce, an open or a click is `null`: recorded, nothing changes.
   */
  outcome: "bounced" | "complained" | null;
  /** The id the relay returned at send time, matching `sends.message_id`. */
  messageId: string | null;
  /** The recipient, for mail that isn't in `sends` (confirmation emails). */
  email: string | null;
  /** For a click, the link. */
  link: string | null;
  occurredAt: string;
  /** Why, in the relay's words, for the note to Max. */
  detail: string | null;
  payload: unknown;
}

/**
 * Checks a Resend webhook's signature and normalises it. Throws if the
 * signature is wrong or stale, so a forged request can't mark anyone bounced.
 * `body` must be the raw request text: the signature covers its exact bytes.
 */
export function resendWebhook(options: { apiKey: string; secret: string }) {
  // Verifying makes no API call, but the client won't construct without a key.
  const client = new Resend(options.apiKey);
  return (body: string, headers: Headers): RelayEvent => {
    const id = headers.get("svix-id") ?? headers.get("webhook-id") ?? "";
    const event = client.webhooks.verify({
      payload: body,
      headers: {
        id,
        timestamp: headers.get("svix-timestamp") ?? headers.get("webhook-timestamp") ?? "",
        signature: headers.get("svix-signature") ?? headers.get("webhook-signature") ?? "",
      },
      webhookSecret: options.secret,
    });

    const data = event.data as Partial<{
      email_id: string;
      to: string[] | string;
      bounce: { type?: string; subType?: string; message?: string };
      click: { link?: string };
      suppressed: { type?: string; message?: string };
    }>;

    let outcome: RelayEvent["outcome"] = null;
    let detail: string | null = null;
    if (event.type === "email.bounced") {
      // Resend passes on SES's bounce types: Permanent, Transient (mailbox
      // full, out of office) and Undetermined. Only Permanent is a dead
      // address; the rest get another go next Sunday.
      if (data.bounce?.type === "Permanent") outcome = "bounced";
      detail = [data.bounce?.type, data.bounce?.subType, data.bounce?.message]
        .filter(Boolean)
        .join(": ");
    } else if (event.type === "email.complained") {
      outcome = "complained";
    } else if (event.type === "email.suppressed") {
      // Resend refused to send because the address is on its suppression
      // list, from an earlier hard bounce or complaint. It will never get
      // through, so stop trying.
      outcome = "bounced";
      detail = data.suppressed?.message ?? "on the relay's suppression list";
    }

    const to = Array.isArray(data.to) ? data.to[0] : data.to;
    return {
      id,
      type: event.type,
      outcome,
      messageId: data.email_id ?? null,
      email: to ?? null,
      link: data.click?.link ?? null,
      occurredAt: event.created_at,
      detail: detail || null,
      payload: event,
    };
  };
}
