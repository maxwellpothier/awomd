import Image from "next/image";
import Link from "next/link";
import { subscribeMessage } from "@/content/site";
import logo from "../../../public/brand/logo.png";

const nav = [
  { href: "/issues", label: "Inbox" },
  { href: "/about", label: "About" },
] as const;

/**
 * The app bar. Slim, because the letter in the reading pane carries the big
 * banner itself — a second one above it would be the logo twice.
 */
export function Header() {
  return (
    <header className="bg-navy text-cream">
      <div className="mx-auto flex h-16 items-center justify-between gap-6 px-5">
        <Link href="/" aria-label="A Week on My Desk, home" className="block">
          <Image
            src={logo}
            alt="A Week on My Desk"
            priority
            sizes="160px"
            className="h-9 w-auto"
          />
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-5 font-display text-[12px] uppercase tracking-[0.2em]">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-cream/80 transition-colors hover:text-orange"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={subscribeMessage.path}
                className="block rounded-sm bg-orange px-3 py-1.5 text-navy transition-colors hover:bg-cream"
              >
                Subscribe
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="h-1 bg-orange" aria-hidden />
    </header>
  );
}
