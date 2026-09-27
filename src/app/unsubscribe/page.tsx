import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Stop receiving A Week on My Desk.",
  // Nothing here should ever land in a search result.
  robots: { index: false, follow: false },
};

/**
 * Where the email's Unsubscribe button lands. The work is done before this
 * page: `/api/unsubscribe` takes the reader off by their token and redirects
 * here with the outcome.
 *
 * - `?done=1&token=…`: they're off. Offers the undo, since a mis-tap or a mail
 *   scanner following links can get here without meaning to.
 * - `?resubscribed=1`: the undo worked.
 * - `?error=1`: the link was bad or the database was down.
 * - nothing: someone pressed the button in the site's copy of the letter,
 *   which carries no token. Points them at the button in their latest email.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : "";

  if (query.done === "1") {
    return (
      <Page title="You're unsubscribed">
        <p>
          You won&rsquo;t get any more issues. Thanks for reading while you did.
        </p>
        {token ? (
          <form method="post" action={`/api/unsubscribe?token=${encodeURIComponent(token)}`}>
            <input type="hidden" name="undo" value="1" />
            <p className="text-base leading-7 text-ink-muted">
              Didn&rsquo;t mean to?
            </p>
            <button
              type="submit"
              className="mt-3 inline-block rounded-[3px] bg-navy px-6 py-3 text-[17px] font-medium text-cream transition-colors hover:bg-navy-soft"
            >
              Keep me on the list
            </button>
          </form>
        ) : null}
      </Page>
    );
  }

  if (query.resubscribed === "1") {
    return (
      <Page title="You're back on">
        <p>Next Sunday&rsquo;s issue will reach you as usual.</p>
      </Page>
    );
  }

  const latest = (
    <>
      click the Unsubscribe button at the bottom of the latest issue in your
      inbox. It takes you off straight away.
    </>
  );

  return (
    <Page title="Unsubscribe">
      {query.error === "1" ? (
        <>
          <p>That link didn&rsquo;t work. It may be from an old email. Instead, {latest}</p>
          <p className="text-base leading-7 text-ink-muted">
            If that doesn&rsquo;t work either, reply to any issue or write to{" "}
            <span className="whitespace-nowrap">{site.replyAddress}</span> and
            I&rsquo;ll take you off.
          </p>
        </>
      ) : (
        <p>To unsubscribe, {latest}</p>
      )}
    </Page>
  );
}

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-[640px] px-6 py-14 sm:px-8 sm:py-20">
      <h1 className="font-display text-[44px] leading-[1.08] sm:text-[64px]">
        {title}
      </h1>
      <div className="mt-8 space-y-6 text-[19px] leading-[1.65]">{children}</div>
    </article>
  );
}
