import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/brand/logo.png";

const nav = [
  { href: "/", label: "Latest" },
  { href: "/issues", label: "Archive" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  return (
    <header className="bg-navy text-cream">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pb-7 pt-10 sm:pt-12">
        <Link href="/" aria-label="A Week on My Desk, home" className="block">
          <Image
            src={logo}
            alt="A Week on My Desk"
            priority
            sizes="(max-width: 640px) 280px, 420px"
            className="h-auto w-[280px] sm:w-[420px]"
          />
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-6 font-display text-sm uppercase tracking-[0.2em]">
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
          </ul>
        </nav>
      </div>
      <div className="h-1 bg-orange" aria-hidden />
    </header>
  );
}
