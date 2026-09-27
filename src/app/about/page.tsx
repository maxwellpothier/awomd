import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "I'm Max. Every Sunday at 4pm I send one email about the music I've had on repeat.",
};

const textLink =
  "underline decoration-ink/30 underline-offset-[3px] transition-colors hover:text-orange-deep hover:decoration-orange-deep";

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-[640px] px-6 py-14 sm:px-8 sm:py-20">
      <h1 className="font-display text-[44px] leading-[1.08] sm:text-[64px]">
        About
      </h1>

      <div className="mt-8 space-y-6 text-[19px] leading-[1.65]">
        <p>
          I&rsquo;m Max, and this is my weekly email about music. Every Sunday
          at {site.sendTime} I send out whatever I kept coming back to that
          week. Usually that&rsquo;s albums and songs, sometimes a documentary
          or a book, with some notes on each.
        </p>
        <p>
          I started it for a few reasons. Writing about music helps me figure
          out why I like what I like. It&rsquo;s a good excuse to stay in touch
          with friends and family. And I&rsquo;m always looking for new things
          to listen to, so if something in an issue reminds you of a record I
          should hear, reply and tell me. Maybe it&rsquo;ll even get you
          writing about what you&rsquo;re into.
        </p>
        <p>
          <Link href="/" className={textLink}>
            Subscribe here
          </Link>
          , or email me at{" "}
          <a href={`mailto:${site.replyAddress}`} className={textLink}>
            {site.replyAddress}
          </a>
          .
        </p>
      </div>
    </article>
  );
}
