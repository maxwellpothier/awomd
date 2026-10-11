import type { MetadataRoute } from "next";
import { issues } from "@/content/issues";
import { site } from "@/content/site";

/** Every public page: the signup, the inbox, about, and each issue. */
export default function sitemap(): MetadataRoute.Sitemap {
  const latest = issues.at(0)?.date;
  return [
    { url: `${site.url}/`, lastModified: latest },
    { url: `${site.url}/issues`, lastModified: latest },
    { url: `${site.url}/about` },
    ...issues.map((issue) => ({
      url: `${site.url}/issues/${issue.slug}`,
      lastModified: issue.date,
    })),
  ];
}
