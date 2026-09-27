/**
 * The footer's top edge: a navy sheet, torn along its top and laid on the
 * letter, so the letter ends the way the banner begins. Same tear as the
 * banner (src/design/tear.ts), turned to face up, with its own seeds.
 *
 * Three layers, bottom up: the sheet's shadow on the letter, its paler core
 * showing along the rip, and the navy. Above the tear the PNG is
 * transparent, so the letter's own background shows through. Below it the
 * navy is flat `color.navy`, the footer cell's own colour, so the image and
 * the cell under it meet without a seam.
 *
 * Writes public/brand/footer-tear.png: `npm run footer`.
 */
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { color } from "../src/design/tokens.ts";
import { paperCore, tear } from "../src/design/tear.ts";

const output = fileURLToPath(new URL("../public/brand/footer-tear.png", import.meta.url));

/** The letter's width, drawn at 2x. */
const width = 600;
const scale = 2;
const height = 28;
/** Where the navy's edge runs, down from the top. */
const line = 15;
const phase = 5.3;

type Edge = { t: number; y: number }[];

/** The navy's surface: the waves and the fibers' jags. */
const surface = tear(90210, (strength, random) => (random() - 0.5) * 5 * strength, phase);
/**
 * The core: the same waves, reaching up past the surface where it ripped.
 * `tear` pushes its extra downward, so it is flipped around the waves.
 */
const flat = tear(0, () => 0, phase);
const core: Edge = tear(
  31337,
  (strength, random) => 1 + strength * (2 + random() * 4) + (random() - 0.5) * 2,
  phase,
).map(({ t, y }, i) => ({ t, y: 2 * flat[i].y - y }));

/**
 * Everything below an edge. Run a little past both sides, so the shadow
 * doesn't thin out at the letter's edges.
 */
function below(points: Edge) {
  const edge = points.map(
    ({ t, y }) => `${((t * (width + 20) - 10) * scale).toFixed(1)},${((line + y) * scale).toFixed(1)}`,
  );
  return `<polygon points="${(width + 10) * scale},${(height + 10) * scale} ${edge.join(" ")} -20,${(height + 10) * scale}"/>`;
}

const svg = (body: string) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}">${body}</svg>`,
  );

// The sheet lies flat, so its shadow barely clears the edge: a close one and
// a faint wide one, lifted a touch so they show above the tear.
const shadow = (blur: number, lift: number, opacity: number) => `
  <filter id="b${blur}" x="-5%" y="-100%" width="110%" height="300%">
    <feGaussianBlur stdDeviation="${(blur * scale).toFixed(2)}"/>
  </filter>
  <g filter="url(#b${blur})" fill="${color.navy}" fill-opacity="${opacity}" transform="translate(0 ${-lift * scale})">
    ${below(core)}
  </g>`;

await sharp({
  create: {
    width: width * scale,
    height: height * scale,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    { input: svg(shadow(1.2, 0.5, 0.3) + shadow(4, 1, 0.14)) },
    { input: svg(`<g fill="${paperCore}">${below(core)}</g>`) },
    { input: svg(`<g fill="${color.navy}">${below(surface)}</g>`) },
  ])
  .png({ palette: true, colours: 64, effort: 10, compressionLevel: 9 })
  .toFile(output);

const kb = (statSync(output).size / 1024).toFixed(0);
console.log(`tear-footer: wrote footer-tear.png, ${width * scale}x${height * scale} (${width}x${height} in the letter), ${kb} KB`);
