import { IssueArticle } from "@/components/site/IssueArticle";
import { latestIssue } from "@/content/issues";

/** The home page is the latest issue, in full. */
export default function Home() {
  return <IssueArticle meta={latestIssue} />;
}
