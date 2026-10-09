import "server-only";
import { latestIssue } from "@/content/issues";
import { site } from "@/content/site";
import { db } from "@/db/supabase";
import { resendRelay } from "@/email/relay";
import { renderIssueEmail } from "@/email/render";

/**
 * The latest issue, sent to someone the moment they confirm, with a welcome
 * note above the banner (`WelcomeNote`). Nobody who signs up on a Monday has
 * to wait six days to see what they signed up for.
 *
 * It is a real send of that issue: claimed in `sends` first, exactly like
 * the list send, so a Sunday send that runs afterwards (or at the same
 * moment) skips them instead of sending it twice, and a bounce or spam report
 * on it is matched to the reader by its message id. If it fails, the claim
 * is let go and the reader simply gets the next issue on Sunday.
 */
export async function sendWelcome(
  subscriber: { id: string; email: string; unsubscribe_token: string },
  origin: string,
) {
  const issue = latestIssue;
  if (!issue) return;

  const sends = db().from("sends");
  const { data: claim, error: claimError } = await sends
    .insert({ subscriber_id: subscriber.id, issue: issue.slug })
    .select("id")
    .single();
  // Already has it: a list send got there first.
  if (claimError?.code === "23505") return;
  if (claimError) {
    console.error("welcome: could not claim the send:", claimError);
    return;
  }

  try {
    const unsubscribeUrl = `${origin}/api/unsubscribe?token=${subscriber.unsubscribe_token}`;
    const rendered = await renderIssueEmail({
      slug: issue.slug,
      baseUrl: origin,
      unsubscribeUrl,
      welcome: true,
    });

    const from = process.env.SEND_FROM;
    const apiKey = process.env.RESEND_API_KEY;
    if (!from || !apiKey) throw new Error("SEND_FROM and RESEND_API_KEY must be set");
    const replyTo = process.env.SEND_REPLY_TO;

    const { messageId } = await resendRelay({ apiKey, from, replyTo }).send({
      to: subscriber.email,
      ...rendered,
      // The same pair as every list send (scripts/send.mts).
      unsubscribe: {
        mailto: `${replyTo ?? site.replyAddress}?subject=unsubscribe`,
        url: unsubscribeUrl.startsWith("https://") ? unsubscribeUrl : undefined,
      },
    });

    const recorded = await sends.update({ message_id: messageId }).eq("id", claim.id);
    if (recorded.error) console.warn("welcome: sent, but its message id wasn't saved");
  } catch (error) {
    console.error(`welcome: send to ${subscriber.email} failed:`, error);
    await sends.delete().eq("id", claim.id);
  }
}
