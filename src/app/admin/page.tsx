import type { Metadata } from "next";
import type { ReactNode } from "react";
import { isAdmin } from "@/admin/session";
import { issues } from "@/content/issues";
import { db } from "@/db/supabase";

export const metadata: Metadata = {
  title: "Admin",
  // Not in robots.txt either: a disallow line would only advertise it.
  robots: { index: false, follow: false },
};

/** Max's dates, not the server's. */
const timeZone = "America/Denver";

const day = 24 * 60 * 60 * 1000;

type Subscriber = {
  email: string;
  status: "pending" | "confirmed" | "unsubscribed" | "bounced";
  source: string | null;
  created_at: string;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
};

/**
 * Max's view of the list, so "anyone new?" doesn't need asking: the count,
 * who joined and left lately, where they came from, who never confirmed, and
 * how many each issue went to. Behind `ADMIN_PASSWORD` (src/admin/session.ts).
 *
 * - `?error=1`: the password was wrong.
 */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!(await isAdmin())) {
    const { error } = await searchParams;
    return <SignIn wrong={error === "1"} />;
  }

  const [{ data: subscribers, error }, { data: sends, error: sendsError }] = await Promise.all([
    db()
      .from("subscribers")
      .select("email, status, source, created_at, confirmed_at, unsubscribed_at")
      .order("created_at", { ascending: false })
      .returns<Subscriber[]>(),
    db().from("sends").select("issue").returns<{ issue: string }[]>(),
  ]);
  if (error || sendsError) {
    return (
      <Page title="Subscribers">
        <p>Couldn&rsquo;t reach the database. Try again in a minute.</p>
      </Page>
    );
  }

  const confirmed = subscribers.filter((s) => s.status === "confirmed");
  const pending = subscribers.filter((s) => s.status === "pending");
  const left = subscribers.filter((s) => s.status === "unsubscribed" || s.status === "bounced");

  const sentTo = new Map<string, number>();
  for (const { issue } of sends) sentTo.set(issue, (sentTo.get(issue) ?? 0) + 1);

  const sources = new Map<string, number>();
  for (const s of confirmed) {
    const source = s.source ?? "unknown";
    sources.set(source, (sources.get(source) ?? 0) + 1);
  }

  // Joins and leaves, newest first. An unsubscribe date is kept even for
  // someone who came back, so it reads as history: left, then rejoined.
  const activity = [
    ...subscribers.flatMap((s) =>
      s.confirmed_at ? [{ at: s.confirmed_at, email: s.email, what: "joined", via: s.source }] : [],
    ),
    ...subscribers.flatMap((s) =>
      s.unsubscribed_at ? [{ at: s.unsubscribed_at, email: s.email, what: "left", via: null }] : [],
    ),
  ]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 15);

  return (
    <Page title="Subscribers">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        <Stat label="On the list" value={confirmed.length} />
        <Stat label="New this week" value={confirmed.filter((s) => since(7, s.confirmed_at)).length} />
        <Stat label="New this month" value={confirmed.filter((s) => since(30, s.confirmed_at)).length} />
        <Stat label="Never confirmed" value={pending.length} />
      </dl>

      <Section title="Lately">
        {activity.length === 0 ? (
          <p className="text-ink-muted">Nobody yet.</p>
        ) : (
          <ul className="divide-y divide-navy/10">
            {activity.map((a) => (
              <Row
                key={`${a.what}-${a.email}-${a.at}`}
                main={
                  <>
                    <span className={a.what === "joined" ? "text-orange-deep" : "text-ink-muted"}>
                      {a.what === "joined" ? "+" : "−"}
                    </span>{" "}
                    {a.email}
                  </>
                }
                aside={`${a.what}${a.via ? ` via ${a.via}` : ""} · ${dateLabel(a.at)}`}
              />
            ))}
          </ul>
        )}
      </Section>

      <Section title="Where they came from">
        <ul className="divide-y divide-navy/10">
          {[...sources]
            .sort((a, b) => b[1] - a[1])
            .map(([source, count]) => (
              <Row key={source} main={source} aside={String(count)} />
            ))}
        </ul>
      </Section>

      <Section title="Issues">
        <ul className="divide-y divide-navy/10">
          {issues.map((issue) => (
            <Row
              key={issue.slug}
              main={`${issue.number} · ${issue.title}`}
              aside={`sent to ${sentTo.get(issue.slug) ?? 0}`}
            />
          ))}
        </ul>
      </Section>

      {pending.length > 0 ? (
        <Section title="Signed up, never confirmed">
          <p className="mb-3 text-base text-ink-muted">
            Their confirmation email may be in spam. A text from you would do it.
          </p>
          <ul className="divide-y divide-navy/10">
            {pending.map((s) => (
              <Row key={s.email} main={s.email} aside={`signed up ${dateLabel(s.created_at)}`} />
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title={`On the list (${confirmed.length})`}>
        <ul className="divide-y divide-navy/10">
          {confirmed.map((s) => (
            <Row
              key={s.email}
              main={s.email}
              aside={`${s.source ?? "unknown"} · ${s.confirmed_at ? dateLabel(s.confirmed_at) : ""}`}
            />
          ))}
        </ul>
      </Section>

      {left.length > 0 ? (
        <Section title="Off the list">
          <ul className="divide-y divide-navy/10">
            {left.map((s) => (
              <Row
                key={s.email}
                main={s.email}
                aside={`${s.status}${s.unsubscribed_at ? ` · ${dateLabel(s.unsubscribed_at)}` : ""}`}
              />
            ))}
          </ul>
        </Section>
      ) : null}

      <form method="post" action="/api/admin" className="pt-4">
        <input type="hidden" name="signout" value="1" />
        <button type="submit" className="text-base text-ink-muted underline underline-offset-[3px] hover:text-ink">
          Sign out on this device
        </button>
      </form>
    </Page>
  );
}

function SignIn({ wrong }: { wrong: boolean }) {
  return (
    <Page title="Admin">
      <form method="post" action="/api/admin" className="space-y-4">
        <label className="block">
          <span className="text-base text-ink-muted">Password</span>
          <input
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            className="mt-2 block w-full rounded-[3px] border border-navy/25 bg-cream px-4 py-3 text-[17px] outline-none focus:border-navy"
          />
        </label>
        {wrong ? <p className="text-base text-orange-deep">That&rsquo;s not it.</p> : null}
        <button
          type="submit"
          className="inline-block rounded-[3px] bg-navy px-6 py-3 text-[17px] font-medium text-cream transition-colors hover:bg-navy-soft"
        >
          Sign in
        </button>
      </form>
    </Page>
  );
}

/** Whether `at` was within the last `days` days. */
function since(days: number, at: string | null): boolean {
  return at !== null && Date.now() - Date.parse(at) < days * day;
}

function dateLabel(at: string): string {
  return new Date(at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone });
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-base text-ink-muted">{label}</dt>
      <dd className="font-display text-[44px] leading-none">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-[26px] leading-tight">{title}</h2>
      {children}
    </section>
  );
}

/** One line of a list: the thing, and a quieter note that wraps under it on a phone. */
function Row({ main, aside }: { main: ReactNode; aside: string }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 py-2 text-base">
      <span className="min-w-0 [overflow-wrap:anywhere]">{main}</span>
      <span className="text-[15px] text-ink-muted">{aside}</span>
    </li>
  );
}

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-[720px] px-6 py-14 sm:px-8 sm:py-20">
      <h1 className="font-display text-[44px] leading-[1.08] sm:text-[64px]">{title}</h1>
      <div className="mt-8 space-y-10 text-[19px] leading-[1.65]">{children}</div>
    </article>
  );
}
