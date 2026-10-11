import { readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { color, pillColors, pillTint } from "@/design/tokens";
import { paperCore, tear } from "@/design/tear";
import type { Pills as PillList } from "@/content/blocks";

/**
 * What the share images (story images and link previews) are drawn with.
 *
 * They are made on the server by `next/og`, which lays out a small subset of
 * CSS (flexbox, absolute positioning, transforms) and only knows the fonts it
 * is handed. The letter's own faces are installed ones the server doesn't
 * have, so the images use the open faces closest to them (assets/fonts).
 */

// Every read names its folder outright, so the build only has to carry those
// folders to the server, not the whole project.
const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", basename(file)));

/** Read once per server, shared by every image. */
const fontData = Promise.all([
  font("roboto-condensed-800.woff"),
  font("gelasio-400.woff"),
  font("gelasio-400-italic.woff"),
]);

export async function fonts() {
  const [display, serif, serifItalic] = await fontData;
  return [
    { name: "Display", data: display, weight: 800 as const, style: "normal" as const },
    { name: "Serif", data: serif, weight: 400 as const, style: "normal" as const },
    { name: "Serif", data: serifItalic, weight: 400 as const, style: "italic" as const },
  ];
}

export const display = { fontFamily: "Display", fontWeight: 800 } as const;
export const serif = { fontFamily: "Serif", fontWeight: 400 } as const;

const mime: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** Where under /public an image can come from. */
const folders = {
  covers: (file: string) => readFile(join(process.cwd(), "public/covers", file)),
  brand: (file: string) => readFile(join(process.cwd(), "public/brand", file)),
};

/**
 * A cover or brand image under /public (`/covers/…`, `/brand/…`) as a data
 * URL, which is how `next/og` wants local images. `undefined` for anything
 * missing, remote or elsewhere, so a bad cover path drops that cover rather
 * than failing the image.
 */
export async function publicImage(src: string | undefined): Promise<string | undefined> {
  const [, folder, file] = src?.match(/^\/(covers|brand)\/([^/]+)$/) ?? [];
  const type = file ? mime[extname(file).toLowerCase()] : undefined;
  if (!type) return undefined;
  try {
    const data = await folders[folder as keyof typeof folders](file);
    return `data:${type};base64,${data.toString("base64")}`;
  } catch {
    return undefined;
  }
}

/**
 * The bottom of a sheet of paper, torn: a strip `height` tall, paper colour
 * down to the tear and transparent under it, as an SVG data URL to lay
 * directly under a box of the same colour and width. The same tear as the
 * site and the letter (`design/tear.ts`), at its own seed.
 */
export function tornEdge({
  width,
  height,
  seed,
  fill = paperCore,
}: {
  width: number;
  height: number;
  seed: number;
  fill?: string;
}): string {
  const scale = width / 400;
  const middle = height / 2;
  const edge = tear(seed, (strength, random) => (random() - 0.5) * 4 * strength, 1.7).map(
    ({ t, y }) =>
      `${(t * width).toFixed(1)},${Math.min(height, Math.max(0, middle + y * scale * 1.3)).toFixed(1)}`,
  );
  // Starts a pixel above the strip so the paper runs on unbroken from the
  // box it is laid under.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<polygon fill="${fill}" points="0,-1 ${width},-1 ${edge.join(" ")}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** The letter's pill chips, the same tint for the same word. */
export function Pills({ pills, size }: { pills?: PillList; size: number }) {
  if (!pills?.length) return null;
  const tints = pills.reduce<number[]>(
    (picked, pill) => [...picked, pillTint(pill, picked.at(-1) ?? -1)],
    [],
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: size * 0.4 }}>
      {pills.map((pill, i) => {
        return (
          <div
            key={pill}
            style={{
              ...serif,
              display: "flex",
              padding: `${size * 0.18}px ${size * 0.62}px`,
              borderRadius: 999,
              backgroundColor: pillColors[tints[i]],
              color: color.ink,
              fontSize: size,
              lineHeight: 1.3,
            }}
          >
            {pill}
          </div>
        );
      })}
    </div>
  );
}

/** The logo, orange on transparent, for laying on navy. 1120 × 540. */
export const logo = publicImage("/brand/logo.png");
export const logoAspect = 540 / 1120;

export { color, paperCore };
