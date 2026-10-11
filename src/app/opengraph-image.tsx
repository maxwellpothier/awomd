import { latestIssue } from "@/content/issues";
import { previewImage, previewSize } from "@/images/preview";

/**
 * The card under a link to the site: the homepage's headline on a torn
 * sheet, with the latest issue's covers beside it. Issue pages have their
 * own (issues/[slug]/opengraph-image.tsx).
 */
export const alt = "A Week on My Desk: music worth passing along, every Sunday evening";
export const size = previewSize;
export const contentType = "image/png";

export default function Image() {
  return previewImage({
    title: "Music worth passing along",
    line: "The albums and songs that stayed on my desk all week, every Sunday evening.",
    covers: latestIssue?.covers ?? [],
  });
}
