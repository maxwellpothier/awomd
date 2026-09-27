/**
 * Cuts the email banner's bottom edge with the same paper tear as the site's
 * masthead (src/design/tear.ts), so the letter opens the way the homepage
 * does.
 *
 * Email can't clip an element to a shape, so the tear is baked into the
 * image: the navy sheet, the paler core showing along the rip, and the
 * shadow, over transparency. Below the tear the letter's own background shows
 * through — cream, or dark when a client darkens the email — so no strip of
 * cream is left stranded in dark mode.
 *
 * The logo runs to the source's bottom edge, so the navy is extended first,
 * tiled from an empty corner (its texture is near flat), and the tear is cut
 * through the extension, clear of the logo.
 *
 * Reads public/brand/email-logo.jpg, writes public/brand/email-banner.png.
 * Run it again only if the logo or the tear changes: `npm run banner`.
 */
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { color } from "../src/design/tokens.ts";
import { coreDepth, coreTear, navyTear, paperCore, type TearPoint } from "../src/design/tear.ts";

const path = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const source = path("public/brand/email-logo.jpg");
const output = path("public/brand/email-banner.png");

/** The letter is 600 CSS pixels wide; the source is drawn at 1.5x. */
const width = 900;
const scale = width / 600;
/** The site's slant, clamp(24px, 5vw, 72px), at a 600px-wide letter. */
const slant = 30 * scale;
/** Navy added under the logo, for the tear to cut through. */
const extension = 40;
/** Room under the tear for the shadow. Keeps the height a multiple of 3. */
const shadowRoom = 8;

const { height: sourceHeight = 0 } = await sharp(source).metadata();
const paperBottom = sourceHeight + extension;
const height = paperBottom + shadowRoom;

/** A tear as an SVG polygon over the whole sheet, in image pixels. */
function polygon(points: TearPoint[]) {
  const edge = points.map(({ t, y }) => {
    const x = t * width;
    const edgeY = paperBottom - coreDepth * scale - slant * t + y * scale;
    return `${x.toFixed(1)},${edgeY.toFixed(1)}`;
  });
  return `0,0 ${width},0 ${edge.join(" ")}`;
}

const svg = (body: string) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`,
  );

// The navy, extended: a near-flat corner patch tiled under everything, then
// the banner over it.
const patch = await sharp(source).extract({ left: 0, top: 0, width: 140, height: 90 }).toBuffer();
const navySheet = await sharp({
  create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([
    { input: patch, tile: true, top: 0, left: 0 },
    { input: source, top: 0, left: 0 },
  ])
  .png()
  .toBuffer();

// Each layer cut to its tear.
const cut = (input: Buffer, points: TearPoint[]) =>
  sharp(input)
    .composite([{ input: svg(`<polygon points="${polygon(points)}"/>`), blend: "dest-in" }])
    .png()
    .toBuffer();

const navy = await cut(navySheet, navyTear);
const core = await cut(
  await sharp({ create: { width, height, channels: 4, background: paperCore } })
    .png()
    .toBuffer(),
  coreTear,
);

// The site's drop-shadow(0 2px 3px rgb(15 19 30 / 0.28)), at this scale.
const shadow = svg(`
  <filter id="s" x="0" y="0" width="100%" height="100%">
    <feGaussianBlur stdDeviation="${(1.5 * scale).toFixed(2)}"/>
  </filter>
  <g filter="url(#s)" fill="${color.navy}" fill-opacity="0.28" transform="translate(0 ${2 * scale})">
    <polygon points="${polygon(navyTear)}"/>
    <polygon points="${polygon(coreTear)}"/>
  </g>
`);

await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: shadow }, { input: core }, { input: navy }])
  // A 128-colour palette keeps the file email-sized (about 120 KB) and still
  // holds the logo's texture; at 64 colours the texture starts to go.
  .png({ palette: true, quality: 70, colours: 128, effort: 10, compressionLevel: 9 })
  .toFile(output);

const kb = (statSync(output).size / 1024).toFixed(0);
console.log(`tear-banner: wrote email-banner.png, ${width}x${height} (${width / scale}x${height / scale} in the letter), ${kb} KB`);
