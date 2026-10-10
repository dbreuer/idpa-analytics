import type { MetadataRoute } from "next";

import { canonicalUrl } from "@/lib/discipline-paths";

export default function robots(): MetadataRoute.Robots {
  const isPreview = process.env.VERCEL_ENV === "preview";
  return {
    rules: {
      userAgent: "*",
      allow: isPreview ? undefined : "/",
      disallow: isPreview ? "/" : undefined,
    },
    sitemap: canonicalUrl("/sitemap.xml"),
  };
}
