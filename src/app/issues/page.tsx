import type { Metadata } from "next";
import { Inbox } from "@/components/site/Inbox";
import { latestIssue } from "@/content/issues";

export const metadata: Metadata = {
  title: "Inbox",
  description: "Every issue of A Week on My Desk.",
};

/**
 * The inbox. On a phone this is the list; on a wide screen the list sits
 * beside the latest issue, since an empty reading pane helps nobody.
 */
export default function InboxPage() {
  return <Inbox selected={latestIssue} view="list" />;
}
