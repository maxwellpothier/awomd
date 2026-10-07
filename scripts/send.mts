/**
 * Send an issue.
 *
 *   npm run send -- --issue 2026-09-27 --to me
 *   npm run send -- --issue 2026-09-27 --to list --dry-run
 *   npm run send -- --issue 2026-09-27 --to list
 *
 * The list send normally runs itself: merging a new issue into main sends it
 * (.github/workflows/send-issue.yml). By hand it's for self-sends, dry runs,
 * and finishing a send that stopped.
 *
 * The command does not render the email. It fetches the render from the running
 * app, which is the same URL the preview toggle opens — so what was reviewed is
 * exactly what goes out, by construction rather than by discipline. Point it at
 * the live site with SEND_ORIGIN=https://awomd.com, or at a local app started
 * with SITE_URL set; a list send refuses a render with localhost URLs in it.
 *
 * `--to list` is every confirmed subscriber. Each gets their own render, with
 * their unsubscribe token in it, and a row in `sends`: nobody gets an issue
 * twice, and a run that stops resumes where it left off when run again.
 *
 * `--to me` sends to SEND_SELF_TO and records nothing, so a draft can be sent
 * to yourself as often as it changes.
 */
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";
import { findIssue } from "../src/content/issues.ts";
import { consoleRelay, resendRelay, type Relay } from "../src/email/relay.ts";

const { values } = parseArgs({
  options: {
    issue: { type: "string" },
    to: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

function fail(message: string): never {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

const slug = values.issue ?? fail("--issue is required, e.g. --issue 2026-09-27");
const audience = values.to ?? fail("--to is required: 'me' or 'list'");
if (audience !== "me" && audience !== "list") {
  fail(`--to must be 'me' or 'list', got '${audience}'`);
}
const dryRun = values["dry-run"] === true;

const meta = findIssue(slug) ?? fail(`Unknown issue: ${slug}`);

const origin = (process.env.SEND_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
const from = process.env.SEND_FROM ?? fail("SEND_FROM is not set");
const replyTo = process.env.SEND_REPLY_TO;

/**
 * `src/db/supabase.ts` is `server-only`, so the script makes its own
 * service-role client.
 */
const db = createClient(
  process.env.SUPABASE_URL ?? fail("SUPABASE_URL is not set"),
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? fail("SUPABASE_SERVICE_ROLE_KEY is not set"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

type Recipient = { id?: string; email: string; unsubscribe_token?: string };

/** Who this run is for, less anyone who already has the issue. */
async function recipients(): Promise<{ queue: Recipient[]; total: number }> {
  if (audience === "me") {
    const email = process.env.SEND_SELF_TO ?? fail("SEND_SELF_TO is not set");
    // Your own row, if you're on the list, so the button in a self-send is a
    // real one. Clicking it takes you off; the page it lands on has the undo.
    const { data, error } = await db
      .from("subscribers")
      .select("email, unsubscribe_token")
      .eq("email", email)
      .maybeSingle();
    if (error) fail(`Could not read subscribers: ${error.message}`);
    return { queue: [data ?? { email }], total: 1 };
  }

  const { data: confirmed, error } = await db
    .from("subscribers")
    .select("id, email, unsubscribe_token")
    .eq("status", "confirmed")
    .order("created_at");
  if (error) fail(`Could not read subscribers: ${error.message}`);

  const { data: sent, error: sendsError } = await db
    .from("sends")
    .select("subscriber_id")
    .eq("issue", slug);
  if (sendsError) fail(`Could not read sends: ${sendsError.message}`);
  const done = new Set(sent.map((row) => row.subscriber_id));

  return {
    queue: confirmed.filter((row) => !done.has(row.id)),
    total: confirmed.length,
  };
}

/** The render for one reader: their token is in its Unsubscribe button. */
async function fetchRender(
  token?: string,
): Promise<{ html: string; text: string; unsubscribeUrl: string }> {
  const url = new URL(`${origin}/issues/${slug}/email`);
  if (token) url.searchParams.set("token", token);
  const textUrl = new URL(url);
  textUrl.searchParams.set("text", "1");
  const [htmlRes, textRes] = await Promise.all([fetch(url), fetch(textUrl)]);
  if (!htmlRes.ok) fail(`Could not fetch ${url} — is the app running? (${htmlRes.status})`);
  if (!textRes.ok) fail(`Could not fetch the plain-text render (${textRes.status})`);
  return {
    html: await htmlRes.text(),
    text: await textRes.text(),
    unsubscribeUrl: htmlRes.headers.get("x-unsubscribe-url") ?? "",
  };
}

const { html } = await fetchRender();

// A real send with localhost URLs means every image is broken in every inbox,
// and it is completely silent until someone tells you. Refuse instead.
if (!dryRun && audience === "list" && /localhost|127\.0\.0\.1/.test(html)) {
  fail(
    "The render contains localhost URLs. Send from the live site " +
      "(SEND_ORIGIN=https://awomd.com), or restart the app with SITE_URL=https://awomd.com.",
  );
}

const relay: Relay = dryRun
  ? consoleRelay()
  : resendRelay({
      apiKey: process.env.RESEND_API_KEY ?? fail("RESEND_API_KEY is not set"),
      from,
      replyTo,
    });

const { queue, total } = await recipients();
const subject = meta.title;
const already = total - queue.length;

console.log(`
  Issue    ${meta.number} — ${meta.title} (${slug})
  Subject  ${subject}
  From     ${from}
  To       ${audience === "me" ? "you" : "the list"}
  Relay    ${relay.name}${dryRun ? "  (dry run)" : ""}
  Source   ${origin}/issues/${slug}/email
  Sending  ${queue.length} of ${total}${already ? `  (${already} already sent)` : ""}
`);

if (queue.length === 0) {
  console.log("  Nothing to do.\n");
  process.exit(0);
}

/**
 * A list send claims the reader's `sends` row before sending, so two runs at
 * once can't both send to them: the unique (subscriber, issue) lets one
 * insert through. If the send then fails the claim is let go, so a re-run
 * tries them again.
 */
async function claim(recipient: Recipient): Promise<string | null> {
  if (audience === "me" || dryRun || !recipient.id) return "unrecorded";
  const { data, error } = await db
    .from("sends")
    .insert({ subscriber_id: recipient.id, issue: slug })
    .select("id")
    .single();
  if (error?.code === "23505") return null;
  if (error) throw error;
  return data.id;
}

let sent = 0;
for (const recipient of queue) {
  const to = recipient.email;
  let claimed: string | null = null;
  try {
    claimed = await claim(recipient);
    if (claimed === null) {
      console.log(`    ~ ${to} — another run already has them`);
      continue;
    }
    const render = await fetchRender(recipient.unsubscribe_token);
    const { messageId } = await relay.send({
      to,
      subject,
      html: render.html,
      text: render.text,
      // The reader's own link, which Gmail and Apple Mail turn into their
      // one-click button (it POSTs; /api/unsubscribe takes that). One-click
      // needs HTTPS, so a localhost render keeps only the mailto.
      unsubscribe: {
        mailto: `${replyTo ?? from}?subject=unsubscribe`,
        url: render.unsubscribeUrl.startsWith("https://") ? render.unsubscribeUrl : undefined,
      },
    });
    if (claimed !== "unrecorded") {
      // Sent is sent: a failure here only loses the relay's id, so it warns
      // rather than stopping the run.
      const recorded = await db.from("sends").update({ message_id: messageId }).eq("id", claimed);
      if (recorded.error) console.warn(`    ! ${to} — sent, but its message id wasn't saved`);
    }
    sent += 1;
    console.log(`    ✓ ${to}`);
  } catch (error) {
    if (claimed && claimed !== "unrecorded") {
      await db.from("sends").delete().eq("id", claimed);
    }
    console.error(`    ✗ ${to} — ${(error as Error).message}`);
    console.error(`\n  Stopped after ${sent}. Run the same command again to resume.\n`);
    process.exit(1);
  }
  // Stay well inside the relay's rate limit.
  await new Promise((r) => setTimeout(r, 600));
}

console.log(`\n  Sent ${sent}.${dryRun ? " (dry run — nothing left the building.)" : ""}\n`);
