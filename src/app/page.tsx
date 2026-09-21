import { Inbox } from "@/components/site/Inbox";

/**
 * Home opens the subscribe message. Most people who land here were handed
 * the link, so the form is the first thing they see; readers arrive at
 * issues by permalink. Flip this to the latest issue when recruiting is done.
 */
export default function Home() {
  return <Inbox open={{ kind: "subscribe", state: "form" }} view="message" />;
}
