"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavLinks, SubscribeButton } from "@/components/site/Nav";
import { coreDepth, coreTear, navyTear, paperCore, type TearPoint } from "@/design/tear";
import logo from "../../../public/brand/logo.png";

/**
 * The masthead's torn bottom edge as a clip-path: the shared tear
 * (src/design/tear.ts) along the slant from globals.css, laid on the cream
 * page with the paler core of the paper showing along the rip.
 */
function clip(points: TearPoint[]) {
  const edge = points.map(
    ({ t, y }) =>
      `${(t * 100).toFixed(3)}% calc(100% - ${coreDepth}px - var(--slant) * ${t.toFixed(4)} + ${y.toFixed(2)}px)`,
  );
  return `polygon(0 0, 100% 0, ${edge.join(", ")})`;
}

const navyEdge = clip(navyTear);
const coreEdge = clip(coreTear);

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
          className="absolute inset-0"
          style={{ background: paperCore, clipPath: coreEdge }}
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
