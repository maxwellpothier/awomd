import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import "./globals.css";

const siteName = "A Week on My Desk";
const description =
  "A weekly email about the albums and songs I've had on repeat, sent every Sunday at 4pm. From Max.";

export const metadata: Metadata = {
  metadataBase: new URL("https://awomd.com"),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description,
  openGraph: {
    type: "website",
    siteName,
    title: siteName,
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description,
  },
};

/**
 * No site footer: the letter in the reading pane ends in its own navy footer
 * with reply and unsubscribe, and a second one under it would be two footers.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
