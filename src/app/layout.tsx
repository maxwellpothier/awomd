import type { Metadata } from "next";
import { Anton, Source_Serif_4 } from "next/font/google";
import { Header } from "@/components/site/Header";
import "./globals.css";

const display = Anton({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

const siteName = "A Week on My Desk";
const description =
  "A weekly newsletter about the music that crossed Max's desk. Albums, tracks, and the occasional documentary, with notes on why they stuck.";

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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
