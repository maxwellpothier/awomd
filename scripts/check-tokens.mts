/**
 * Fails if the CSS custom properties in `globals.css` have drifted from the
 * literal values in `src/design/tokens.ts`.
 *
 * The two have to be stated separately — Tailwind needs them as CSS, email
 * renderers need them as strings — so this is what keeps them honest.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { color } from "../src/design/tokens.ts";

const cssPath = fileURLToPath(
  new URL("../src/app/globals.css", import.meta.url),
);
const css = readFileSync(cssPath, "utf8");

const root = css.match(/:root\s*\{([^}]*)\}/)?.[1];
if (!root) {
  console.error("check-tokens: no :root block found in globals.css");
  process.exit(1);
}

const declared = new Map<string, string>();
for (const [, name, value] of root.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
  declared.set(name, value.trim());
}

/** Resolve one level of `var(--x)` indirection, e.g. `--ink: var(--navy)`. */
function resolve(value: string): string {
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  return ref ? (declared.get(ref[1]) ?? value) : value;
}

const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const problems: string[] = [];
for (const [key, expected] of Object.entries(color)) {
  const name = kebab(key);
  const actual = declared.get(name);
  if (actual === undefined) {
    problems.push(`--${name} is missing from globals.css (tokens.ts has ${expected})`);
  } else if (resolve(actual).toLowerCase() !== expected.toLowerCase()) {
    problems.push(`--${name} is ${resolve(actual)} in globals.css, ${expected} in tokens.ts`);
  }
}

if (problems.length > 0) {
  console.error("check-tokens: design tokens have drifted\n");
  for (const problem of problems) console.error(`  ${problem}`);
  console.error("\nUpdate src/design/tokens.ts and src/app/globals.css together.");
  process.exit(1);
}

console.log(`check-tokens: ${Object.keys(color).length} colors match`);
