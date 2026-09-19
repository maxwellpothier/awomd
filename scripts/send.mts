/**
 * Send an issue.
 *
 *   npm run send -- --issue 2026-09-20 --to me
 *   npm run send -- --issue 2026-09-20 --to list --dry-run
 *   npm run send -- --issue 2026-09-20 --to list
 *
 * The command does not render the email. It fetches the render from the running
 * app, which is the same URL the preview toggle opens — so what was reviewed is
 * exactly what goes out, by construction rather than by discipline.
 *
 * Requires the app to be running. Start it with SITE_URL set for a real send,
 * or the email will carry localhost image URLs (checked for below).
 */
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
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

const slug = values.issue ?? fail("--issue is required, e.g. --issue 2026-09-20");
const audience = values.to ?? fail("--to is required: 'me' or 'list'");
const dryRun = values["dry-run"] === true;

const meta = findIssue(slug) ?? fail(`Unknown issue: ${slug}`);

const origin = (process.env.SEND_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");
const from = process.env.SEND_FROM ?? fail("SEND_FROM is not set");
const replyTo = process.env.SEND_REPLY_TO;
const selfTo = process.env.SEND_SELF_TO;

/** One email per line. Blank lines and # comments ignored. Never committed. */
function readRecipientFile(path: string): string[] {
  if (!existsSync(path)) fail(`No recipient list at ${path}`);
  return readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.split("#")[0].trim())
    .filter((line) => line.length > 0);
}

const recipients =
  audience === "me"
    ? [selfTo ?? fail("SEND_SELF_TO is not set")]
    : audience === "list"
      ? readRecipientFile("content/recipients.txt")
      : fail(`--to must be 'me' or 'list', got '${audience}'`);

/**
 * The ledger makes a send idempotent and resumable: a recipient cannot get the
 * same issue twice, and a half-failed run picks up where it stopped. It stands
 * in for the `sends` table until Supabase lands — same guarantee, one file.
 */
const ledgerDir = ".sends";
const ledgerPath = `${ledgerDir}/${slug}.jsonl`;
mkdirSync(ledgerDir, { recursive: true });

function alreadySent(): Set<string> {
  if (!existsSync(ledgerPath)) return new Set();
  return new Set(
    readFileSync(ledgerPath, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line).to as string),
  );
}

async function fetchRender(): Promise<{ html: string; text: string }> {
  const url = `${origin}/issues/${slug}/email`;
  const [htmlRes, textRes] = await Promise.all([
    fetch(url),
    fetch(`${url}?text=1`),
  ]);
  if (!htmlRes.ok) fail(`Could not fetch ${url} — is the app running? (${htmlRes.status})`);
  if (!textRes.ok) fail(`Could not fetch the plain-text render (${textRes.status})`);
  return { html: await htmlRes.text(), text: await textRes.text() };
}

const { html, text } = await fetchRender();

// A real send with localhost URLs means every image is broken in every inbox,
// and it is completely silent until someone tells you. Refuse instead.
if (!dryRun && audience === "list" && /localhost|127\.0\.0\.1/.test(html)) {
  fail(
    "The render contains localhost URLs. Restart the app with SITE_URL=https://awomd.com " +
      "so images and links resolve for recipients.",
  );
}

const relay: Relay = dryRun
  ? consoleRelay()
  : resendRelay({
      apiKey: process.env.RESEND_API_KEY ?? fail("RESEND_API_KEY is not set"),
      from,
      replyTo,
    });

const done = alreadySent();
const queue = recipients.filter((to) => !done.has(to));
const subject = `${meta.title} · Issue ${meta.number}`;

console.log(`
  Issue    ${meta.number} — ${meta.title} (${slug})
  Subject  ${subject}
  From     ${from}
  Relay    ${relay.name}${dryRun ? "  (dry run)" : ""}
  Source   ${origin}/issues/${slug}/email
  Sending  ${queue.length} of ${recipients.length}${done.size ? `  (${done.size} already sent)` : ""}
`);

if (queue.length === 0) {
  console.log("  Nothing to do.\n");
  process.exit(0);
}

let sent = 0;
for (const to of queue) {
  try {
    const { messageId } = await relay.send({
      to,
      subject,
      html,
      text,
      // Until subscribers live in a database there are no per-recipient
      // tokens, so unsubscribe is mailto-based. Gmail and Apple Mail still
      // render it as a one-click button; they send mail instead of POSTing.
      // Swap to a tokenised HTTPS URL when the subscribers table lands.
      unsubscribe: { mailto: `${replyTo ?? from}?subject=unsubscribe` },
    });
    if (!dryRun) {
      appendFileSync(
        ledgerPath,
        JSON.stringify({ to, messageId, at: new Date().toISOString() }) + "\n",
      );
    }
    sent += 1;
    console.log(`    ✓ ${to}`);
  } catch (error) {
    console.error(`    ✗ ${to} — ${(error as Error).message}`);
    console.error(`\n  Stopped after ${sent}. Re-run the same command to resume.\n`);
    process.exit(1);
  }
  // Stay well inside the relay's rate limit.
  await new Promise((r) => setTimeout(r, 600));
}

console.log(`\n  Sent ${sent}.${dryRun ? " (dry run — nothing left the building.)" : ""}\n`);
