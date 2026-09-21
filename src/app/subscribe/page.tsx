import type { Metadata } from "next";
import { Inbox } from "@/components/site/Inbox";
import type { SubscribeState } from "@/components/site/SubscribeLetter";
import { subscribeMessage } from "@/content/site";

export const metadata: Metadata = {
  title: "Subscribe",
  description: subscribeMessage.preview,
  openGraph: {
    title: `Subscribe · A Week on My Desk`,
    description: subscribeMessage.preview,
    url: subscribeMessage.path,
  },
};

/**
 * The link to hand around. The pinned subscribe message, open.
 *
 * `?sent=1` and `?confirmed=1` show the two later steps of double opt-in;
 * the route handler and confirm endpoint will redirect here with them once
 * they exist.
 */
export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const state: SubscribeState =
    params.confirmed !== undefined
      ? "confirmed"
      : params.sent !== undefined
        ? "sent"
        : "form";
  return <Inbox open={{ kind: "subscribe", state }} view="message" />;
}
