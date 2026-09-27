/**
 * The paper tear along the bottom of the masthead: on the site it is the
 * header's clip-path (Header.tsx), and in email it is cut into the banner
 * image (scripts/tear-banner.mts). One source, so both draw the same tear.
 *
 * A tear runs across the edge from right (t = 1) to left (t = 0) and is
 * three things: slow waves for the hand, fine jagged steps for the fibers,
 * and a strength that swells and fades along the edge, so some stretches run
 * almost straight and others rip. Nothing is random at render time: the jags
 * come from a seeded generator, so every render draws the same tear.
 *
 * `y` is in CSS pixels, down from where a straight slant would run. The
 * slant itself, and how the points map onto a box, are the caller's.
 */
export interface TearPoint {
  t: number;
  y: number;
}

/** Points across the edge. Enough that the fibers read as fibers. */
const steps = 160;

export function tear(
  seed: number,
  below: (strength: number, random: () => number) => number,
  /** Shifts the waves along the edge, so a second tear isn't the first one again. */
  phase = 0,
) {
  // mulberry32: a tiny seeded generator. Change a seed for a different tear.
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };

  const points: TearPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = 1 - i / steps;
    const waves = 2.2 * Math.sin(t * 19 + 1 + phase) + 1.3 * Math.sin(t * 47 + 4 + phase);
    // 0.2 where the paper tore cleanly, 1 where it ripped.
    const strength = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * 9 + 2.5 + phase)) ** 2;
    points.push({ t, y: waves + below(strength, random) });
  }
  return points;
}

/**
 * Room left under the navy for the paper's paler core to show in: the
 * navy's edge is drawn this far up, and the core's edge is pushed back down
 * into it. CSS pixels.
 */
export const coreDepth = 8;

/** The navy sheet's edge: the jags, drawn above the core's reach. */
export const navyTear = tear(20260926, (strength, random) => (random() - 0.5) * 5 * strength);

/**
 * The core's edge: the same waves, pushed a few pixels further down where
 * the paper ripped hardest, with its own finer jags.
 */
export const coreTear = tear(
  4096,
  (strength, random) => 1 + strength * (2 + random() * 4) + (random() - 0.5) * 2,
);

/** The paper's core, showing along the rip. */
export const paperCore = "#fffefa";
