import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 bg-navy text-cream">
      <div className="h-1 bg-orange" aria-hidden />
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-sm leading-6 text-cream/75">
          A weekly letter about the music on my desk. Sundays at 4pm. Replies
          are the point.
        </p>
        <nav aria-label="Footer">
          <ul className="flex gap-5 font-display text-[11px] uppercase tracking-[0.18em]">
            <li>
              <Link href="/issues" className="text-cream/80 hover:text-orange">
                Archive
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-cream/80 hover:text-orange">
                About
              </Link>
            </li>
            <li>
              <a
                href="mailto:max@awomd.com"
                className="text-cream/80 hover:text-orange"
              >
                Reply
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
