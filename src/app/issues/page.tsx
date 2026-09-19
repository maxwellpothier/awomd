import type { Metadata } from "next";
import Link from "next/link";
import { issueDateLabel, issues } from "@/content/issues";

export const metadata: Metadata = {
  title: "Archive",
  description: "Every issue of A Week on My Desk.",
};

export default function ArchivePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14 sm:py-20">
      <h1 className="font-display text-4xl uppercase leading-none tracking-[0.01em] sm:text-5xl">
        Archive
      </h1>
      <div className="mt-4 h-0.5 w-16 bg-orange" aria-hidden />

      <ul className="mt-12 divide-y divide-cream-deep border-y border-cream-deep">
        {issues.map((issue) => (
          <li key={issue.slug}>
            <Link
              href={`/issues/${issue.slug}`}
              className="group flex flex-col gap-1 py-6 sm:flex-row sm:items-baseline sm:gap-6"
            >
              <span className="font-display text-[11px] uppercase tracking-[0.2em] text-ink-muted sm:w-40 sm:flex-none">
                {issue.number} · {issueDateLabel(issue.date)}
              </span>
              <span className="font-display text-xl uppercase leading-tight tracking-[0.01em] group-hover:text-orange">
                {issue.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
