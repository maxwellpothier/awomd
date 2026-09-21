import { Inbox } from "@/components/site/Inbox";
import { latestIssue } from "@/content/issues";

/** Home is the latest issue, open. On a phone that means the message itself. */
export default function Home() {
  return <Inbox selected={latestIssue} view={latestIssue ? "message" : "list"} />;
}
