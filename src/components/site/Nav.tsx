"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/issues", label: "Issues" },
  { href: "/about", label: "About" },
] as const;

/**
 * Issues and About. A row in the slim bar, stacked at the far left of the
 * homepage masthead. Client-side so the current section can be marked.
 */
export function NavLinks({ stacked = false }: { stacked?: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Primary">
      <ul
        className={
          stacked
            ? "flex flex-col gap-1 text-[15px] sm:gap-1.5 sm:text-[17px]"
            : "flex items-center gap-6 text-[15px]"
        }
      >
        {links.map(({ href, label }) => {
          const current = path === href || path.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={`transition-colors hover:text-cream ${
                  current ? "text-cream" : "text-cream/70"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * The one orange control in the chrome. On the homepage it jumps to the form
 * on the same page; everywhere else it goes to the homepage.
 */
export function SubscribeButton({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="block rounded-[3px] bg-orange px-3 py-1.5 text-sm font-medium text-navy transition-colors hover:bg-cream sm:px-4 sm:py-2 sm:text-[15px]"
    >
      Subscribe
    </Link>
  );
}
