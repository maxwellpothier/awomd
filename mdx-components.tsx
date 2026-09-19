import type { MDXComponents } from "mdx/types";
import { webComponents } from "@/components/blocks/web";

/**
 * The default component map for MDX compiled anywhere in the app.
 *
 * Issues override this per-render by passing `components` explicitly — that is
 * what lets one issue file produce both the web and the email document. Web is
 * the default because it is what `next dev` shows.
 */
export function useMDXComponents(): MDXComponents {
  return webComponents;
}
