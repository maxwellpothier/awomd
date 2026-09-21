import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "A weekly newsletter about the music that crossed Max's desk, and why it stuck.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14 sm:py-20">
      <h1 className="font-display text-4xl uppercase leading-none tracking-[0.01em] sm:text-5xl">
        About
      </h1>
      <div className="mt-4 h-0.5 w-16 bg-orange" aria-hidden />

      <div className="mt-10 space-y-5 text-lg leading-8">
        <p>
          A Week on My Desk is a weekly letter about the music that actually got
          played — albums, tracks, and the occasional documentary or book, with
          notes on why each one stuck.
        </p>
        <p>
          It goes out Sundays at {site.sendTime}. Replies are the point: the
          whole reason this exists is to get recommendations back.
        </p>
        <p>
          <Link
            href="/"
            className="font-display text-sm uppercase tracking-[0.18em] text-orange-deep underline decoration-orange/40 underline-offset-4 hover:text-orange"
          >
            Subscribe
          </Link>
          <span className="text-ink-muted"> · or just write to </span>
          <a
            href={`mailto:${site.replyAddress}`}
            className="underline decoration-orange/40 underline-offset-4 hover:text-orange"
          >
            {site.replyAddress}
          </a>
        </p>
      </div>
    </div>
  );
}
