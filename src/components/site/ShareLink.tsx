"use client";

import { useState } from "react";

/**
 * A button that hands a link to the phone's share sheet, or copies it where
 * there is no share sheet (most desktop browsers). `path` is made absolute
 * against whatever origin the page is on.
 */
export function ShareLink({
  path,
  title,
  text,
  label,
}: {
  path: string;
  title: string;
  text: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        // Closing the sheet is a choice, not a failure.
        if ((error as DOMException).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="mt-4 inline-block rounded-[3px] bg-navy px-5 py-2.5 text-[15px] font-medium text-cream transition-colors hover:bg-navy-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
    >
      <span aria-live="polite">{copied ? "Link copied" : label}</span>
    </button>
  );
}
