import type { Metadata } from "next";
import { Inbox } from "@/components/site/Inbox";
import { latestIssue } from "@/content/issues";

export const metadata: Metadata = {
  title: "Inbox",
  description: "Every issue of A Week on My Desk.",
};

/**
 * The inbox. On a phone this is the list; on a wide screen the latest issue
 * is open beside it. Until the first issue goes out, both halves say so.
 */
export default function InboxPage() {
  return <Inbox open={latestIssue} view="list" />;
}
