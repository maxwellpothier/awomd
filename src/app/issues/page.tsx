import type { Metadata } from "next";
import { Inbox } from "@/components/site/Inbox";
import { latestIssue } from "@/content/issues";

export const metadata: Metadata = {
  title: "Inbox",
  description: "Every issue of A Week on My Desk.",
};

/**
 * The inbox. On a phone this is the list; on a wide screen the latest issue
 * is open beside it, or the subscribe message until there is one.
 */
export default function InboxPage() {
  return (
    <Inbox
      open={
        latestIssue
          ? { kind: "issue", meta: latestIssue }
          : { kind: "subscribe", state: "form" }
      }
      view="list"
    />
  );
}
