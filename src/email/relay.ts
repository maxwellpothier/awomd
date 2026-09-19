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
   * as a one-click button above the message.
   */
  unsubscribe: { mailto?: string; url?: string };
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
