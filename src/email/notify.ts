import "server-only";
import { db } from "@/db/supabase";
import { resendRelay } from "@/email/relay";
import { site } from "@/content/site";

/**
 * A one-line email to Max at the reply address: a new subscriber, a dead
 * address, a spam report. Failures are logged and dropped, because whatever
 * prompted the note has already happened and been recorded.
 */
export async function notifyMax(subject: string, line: string) {
  try {
    const from = process.env.SEND_FROM;
    const apiKey = process.env.RESEND_API_KEY;
    if (!from || !apiKey) throw new Error("SEND_FROM and RESEND_API_KEY must be set");

    await resendRelay({ apiKey, from }).send({
      to: site.replyAddress,
      subject,
      text: line,
      html: `<p>${escapeHtml(line)}</p>`,
    });
  } catch (error) {
    console.error(`note to Max failed (${subject}):`, error);
  }
}

/** " (12 on the list)", to end a note with. Empty if the count fails. */
export async function onTheList(): Promise<string> {
  const { count } = await db()
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed");
  return count === null ? "" : ` (${count} on the list)`;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
