"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLinks, SubscribeButton } from "@/components/site/Nav";
import logo from "../../../public/brand/logo.png";

/**
 * The masthead's bottom edge is a paper tear: the navy sheet is torn along
 * the slant from globals.css and laid on the cream page, with the paler core
 * of the paper showing along the rip and a soft shadow under it.
 *
 * The tear has three parts: slow waves for the hand, fine jagged steps for
 * the fibers, and a strength that swells and fades along the edge, so some
 * stretches run almost straight and others rip. Nothing is random at render
 * time: the jags come from a seeded generator, so every load and the server
 * render draw the same tear. Sizes are in pixels, so the tear stays
 * paper-sized however wide the screen is.
 */
function tear(seed: number, below: (strength: number, random: () => number) => number) {
  // mulberry32: a tiny seeded generator. Change a seed for a different tear.
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };

  const steps = 160;
  const points = ["0 0", "100% 0"];
  for (let i = 0; i <= steps; i++) {
    const t = 1 - i / steps; // 1 at the right edge, 0 at the left
    const waves = 2.2 * Math.sin(t * 19 + 1) + 1.3 * Math.sin(t * 47 + 4);
    // 0.2 where the paper tore cleanly, 1 where it ripped.
    const strength = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * 9 + 2.5)) ** 2;
    const y = waves + below(strength, random);
    points.push(
      `${(t * 100).toFixed(3)}% calc(100% - ${coreDepth}px - var(--slant) * ${t.toFixed(4)} + ${y.toFixed(2)}px)`,
    );
  }
  return `polygon(${points.join(", ")})`;
}

/**
 * Room left under the navy for the core to show in: the navy's edge is drawn
 * this far up, and the core's edge is pushed back down into it.
 */
const coreDepth = 8;

/** The navy sheet's edge: the jags, drawn above the core's reach. */
const navyEdge = tear(20260926, (strength, random) => (random() - 0.5) * 5 * strength);

/**
 * The core's edge: the same waves, pushed a few pixels further down where
 * the paper ripped hardest, with its own finer jags.
 */
const coreEdge = tear(
  4096,
  (strength, random) => 1 + strength * (2 + random() * 4) + (random() - 0.5) * 2,
);

/**
 * The app bar, in two sizes.
 *
 * On the homepage it is the masthead: the logo big and centered and alone,
 * torn along the bottom (above). No nav or Subscribe up there for now (Max,
 * 2026-09-26); the form sits right under it. Everywhere else it is slim,
 * because the letter in the reading pane carries the big banner itself and a
 * second one above it would be the logo twice.
 */
export function Header() {
  const onHome = usePathname() === "/";

  if (onHome) {
    return (
      // The shadow is a filter on this wrapper, not a box-shadow on the
      // header: clip-path cuts box-shadows off, and a filter follows the tear.
      <div className="masthead relative">
        {/* The paper's core, showing along the rip. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[var(--paper-core)]"
          style={{ clipPath: coreEdge }}
        />
        <header
          className="relative bg-navy text-cream"
          style={{ clipPath: navyEdge, paddingBottom: `calc(var(--slant) / 2 + ${coreDepth}px)` }}
        >
          <div className="flex justify-center px-4 py-5 sm:px-8 sm:py-10">
            <Image
              src={logo}
              alt="A Week on My Desk"
              priority
              sizes="(min-width: 640px) 520px, 220px"
              className="h-auto w-[220px] sm:w-[400px] lg:w-[520px]"
            />
          </div>
        </header>
      </div>
    );
  }

  return (
    <header className="bg-navy text-cream">
      <div className="mx-auto flex h-16 items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" aria-label="A Week on My Desk, home" className="block">
          <Image
            src={logo}
            alt="A Week on My Desk"
            priority
            sizes="100px"
            className="h-11 w-auto"
          />
        </Link>
        <div className="flex items-center gap-6">
          <NavLinks />
          <SubscribeButton />
        </div>
      </div>
    </header>
  );
}
