import type { MetadataRoute } from "next";
import { getPublishedGuides } from "@/lib/guides";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const homeUrl = getAbsoluteUrl("/");
  const guidesUrl = getAbsoluteUrl("/guides");
  if (!homeUrl || !guidesUrl) return [];

  const guides = await getPublishedGuides();

  return [
    { url: homeUrl },
    { url: guidesUrl },
    ...guides.map((guide) => ({
      url: getAbsoluteUrl(`/guides/${guide.slug}`) as string,
      lastModified: guide.updated_at,
    })),
  ];
}
