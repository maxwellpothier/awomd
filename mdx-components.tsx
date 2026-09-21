import type { MDXComponents } from "mdx/types";
import { createEmailComponents } from "@/components/blocks/email";

/**
 * The default component map for MDX compiled anywhere in the app.
 *
 * Issues always pass `components` explicitly, stamped with their slug, so
 * this fallback only applies to MDX rendered outside an issue. It is the same
 * renderer either way: there is only one.
 */
export function useMDXComponents(): MDXComponents {
  return createEmailComponents({ issue: "", baseUrl: "" });
}
