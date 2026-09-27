/**
 * Prints the slugs of issues registered in src/content/issues.ts at one
 * commit and not at an earlier one, a line each.
 *
 *   node scripts/new-issues.mts <before-sha> <after-sha>
 *
 * The send workflow runs this on every push to main that touches the
 * registry, and sends whatever it prints. Registering an issue is what
 * publishes it on the site, so it is what sends it too; editing an issue
 * that's already registered sends nothing.
 *
 * Reads the registry's source rather than importing it, so the old version
 * needn't be importable. Each entry's `slug: "..."` is all it looks at.
 */
import { execFileSync } from "node:child_process";

const [before, after] = process.argv.slice(2);
if (!after) {
  console.error("usage: node scripts/new-issues.mts <before-sha> <after-sha>");
  process.exit(1);
}

function slugsAt(commit: string | undefined): Set<string> {
  // A brand-new branch has no before (all zeros); nor does a commit before
  // the registry existed.
  if (!commit || /^0+$/.test(commit)) return new Set();
  let source: string;
  try {
    source = execFileSync("git", ["show", `${commit}:src/content/issues.ts`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return new Set();
  }
  return new Set([...source.matchAll(/\bslug:\s*"([^"]+)"/g)].map((m) => m[1]));
}

const old = slugsAt(before);
for (const slug of slugsAt(after)) {
  if (!old.has(slug)) console.log(slug);
}
