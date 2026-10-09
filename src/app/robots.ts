import type { MetadataRoute } from "next";
import { site } from "@/content/site";

/**
 * Everything public is open. Kept out: the token endpoints and the raw email
 * render of each issue, which would be a second, worse copy of its page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dev/", "/subscribe/", "/unsubscribe", "/issues/*/email"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
