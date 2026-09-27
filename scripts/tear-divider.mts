/**
 * The torn divider: the sheet above is torn along this edge and laid over
 * the sheet below. Same tear as the banner (src/design/tear.ts), with other
 * seeds and the waves shifted so it isn't the banner's edge again.
 *
 * Two layers, bottom up: the top sheet's shadow on the one below, then the
 * top sheet's paler core showing along the rip. The top sheet's surface is
 * the letter's own background, so above the edge the PNG is transparent, and
 * below it everything but the shadow is too: cream shows through, or dark
 * when a client darkens the email.
 *
 * It runs the letter's full width, edge to edge, like the banner; the letter
 * body is cut into sheets around it (the `wrapper` in blocks/email.tsx).
 *
 * Writes public/brand/divider-tear.png: `npm run divider`.
 */
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { color } from "../src/design/tokens.ts";
import { tear } from "../src/design/tear.ts";

const output = fileURLToPath(new URL("../public/brand/divider-tear.png", import.meta.url));

/** The letter's width, drawn at 2x. */
const width = 600;
const scale = 2;
const height = 26;
/** Where the edge runs, down from the top. */
const line = 9;
const phase = 3.1;

/** The top sheet's surface: the waves and the fibers' jags. */
const surface = tear(4242, (strength, random) => (random() - 0.5) * 5 * strength, phase);
/** Its core: the same waves, pushed past the surface where it ripped. */
const core = tear(
  5151,
  (strength, random) => 1 + strength * (2 + random() * 4) + (random() - 0.5) * 2,
  phase,
);

/**
 * Everything above an edge. Run a little past both sides, so the shadow
 * doesn't thin out at the letter's edges.
 */
function above(points: ReturnType<typeof tear>) {
  const edge = points.map(
    ({ t, y }) => `${((t * (width + 20) - 10) * scale).toFixed(1)},${((line + y) * scale).toFixed(1)}`,
  );
  return `<polygon points="${(width + 10) * scale},-20 ${edge.join(" ")} -20,-20"/>`;
}

const svg = (body: string) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}">${body}</svg>`,
  );

// Two shadows, the way paper throws them: a close, darker one where the edge
// nearly touches, and a wide faint one from where it lifts.
const shadow = (blur: number, drop: number, opacity: number) => `
  <filter id="b${blur}" x="-5%" y="-100%" width="110%" height="300%">
    <feGaussianBlur stdDeviation="${(blur * scale).toFixed(2)}"/>
  </filter>
  <g filter="url(#b${blur})" fill="${color.navy}" fill-opacity="${opacity}" transform="translate(0 ${drop * scale})">
    ${above(core)}
  </g>`;

const shadows = await sharp(svg(shadow(1.2, 1.5, 0.3) + shadow(4, 4, 0.14)))
  // Nothing falls on the sheet that casts it.
  .composite([{ input: svg(above(core)), blend: "dest-out" }])
  .png()
  .toBuffer();

// The core, between the surface's edge and its own. Whiter than the
// banner's, because here it has to read against cream, not navy.
const coreBand = await sharp(svg(`<g fill="#ffffff">${above(core)}</g>`))
  .composite([{ input: svg(above(surface)), blend: "dest-out" }])
  .png()
  .toBuffer();

await sharp({
  create: {
    width: width * scale,
    height: height * scale,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: shadows }, { input: coreBand }])
  .png({ palette: true, colours: 64, effort: 10, compressionLevel: 9 })
  .toFile(output);

const kb = (statSync(output).size / 1024).toFixed(0);
console.log(`tear-divider: wrote divider-tear.png, ${width * scale}x${height * scale} (${width}x${height} in the letter), ${kb} KB`);
