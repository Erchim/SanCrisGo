import type { MetadataRoute } from "next";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const sitemapUrl = getAbsoluteUrl("/sitemap.xml");

  return {
    rules: { userAgent: "*", allow: "/" },
    ...(sitemapUrl && { sitemap: sitemapUrl }),
  };
}
