"use client";

import Image from "next/image";
import { useRef, useState, useSyncExternalStore } from "react";

/**
 * Whether this browser can hand an image file to the share sheet, which is
 * what puts Instagram in the list. Phones, mostly; desktop browsers download
 * the image instead.
 */
function canShareFiles() {
  try {
    return (
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [new File([""], "story.png", { type: "image/png" })] })
    );
  } catch {
    return false;
  }
}
const subscribe = () => () => {};

/**
 * One story image on the share page, and the button that shares it.
 *
 * Tapping copies the issue's link first (Instagram can't take a link along
 * with an image, so it goes in a link sticker), then opens the share sheet
 * with the image, or downloads it where there's no share sheet.
 *
 * The image is fetched when a finger or pointer reaches the button, so it is
 * usually in hand by the tap: Safari only opens the share sheet straight from
 * a tap, and a slow download in between can cost it that. If it does, the
 * button asks for a second tap, which then shares at once.
 */
export function StoryTile({
  src,
  filename,
  linkPath,
  title,
  byline,
  priority,
}: {
  /** The story image route. */
  src: string;
  filename: string;
  /** The issue, with its ?ref, for the link sticker. */
  linkPath: string;
  title: string;
  byline: string;
  priority?: boolean;
}) {
  const sharesFiles = useSyncExternalStore(subscribe, canShareFiles, () => false);
  const image = useRef<Promise<Blob> | null>(null);
  const [state, setState] = useState<"ready" | "again" | "done">("ready");

  const load = () =>
    (image.current ??= fetch(src).then((response) => {
      if (!response.ok) throw new Error(`story image: ${response.status}`);
      return response.blob();
    }));

  // Getting it ahead of the tap. A failure here is retried by the tap itself.
  const preload = () => {
    load().catch(() => {
      image.current = null;
    });
  };

  async function share() {
    // Not awaited: it mustn't use up the tap the share sheet needs.
    navigator.clipboard?.writeText(new URL(linkPath, window.location.origin).toString()).catch(() => {});
    try {
      const blob = await load();
      const file = new File([blob], filename, { type: "image/png" });
      if (sharesFiles && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          setState("done");
        } catch (error) {
          const name = (error as DOMException).name;
          if (name === "NotAllowedError") setState("again");
          else if (name !== "AbortError") throw error;
        }
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setState("done");
    } catch {
      image.current = null;
      window.open(src, "_blank");
    }
  }

  return (
    <figure className="flex flex-col">
      <Image
        src={src}
        alt={`Story image: ${title}, ${byline}`}
        width={1080}
        height={1920}
        sizes="(min-width: 1024px) 230px, (min-width: 640px) 30vw, 45vw"
        priority={priority}
        className="h-auto w-full rounded-[6px] shadow-[0_1px_3px_rgba(15,19,30,0.10),0_8px_28px_-12px_rgba(15,19,30,0.25)]"
      />
      <figcaption className="mt-3 min-w-0 text-[15px] leading-5">
        <span className="block truncate font-semibold">{title}</span>
        <span className="block truncate text-ink-muted">{byline}</span>
      </figcaption>
      <button
        type="button"
        onClick={share}
        onPointerEnter={preload}
        onTouchStart={preload}
        onFocus={preload}
        className="mt-3 rounded-[3px] bg-navy px-4 py-2 text-[15px] font-medium text-cream transition-colors hover:bg-navy-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
      >
        {state === "again" ? "Tap again to share" : sharesFiles ? "Share" : "Download"}
      </button>
      <p aria-live="polite" className="mt-2 min-h-5 text-sm leading-5 text-ink-muted">
        {state === "done" ? "Link copied for a link sticker" : ""}
      </p>
    </figure>
  );
}
