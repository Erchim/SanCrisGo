import type { Metadata } from "next";
import { ContributionContent } from "@/app/_components/contribution-content";
import { staticLocalizedPaths } from "@/lib/locales";
import { localizedAlternates } from "@/lib/localized-metadata";
import { getAbsoluteUrl } from "@/lib/site-url";

const paths = staticLocalizedPaths("/contribute") as { en: string; es: string };
const canonical = getAbsoluteUrl(paths.en);
const description = "Send a Place, Event, local service, photo, or correction to SanCrisGo through a moderated WhatsApp contribution flow.";

export const metadata: Metadata = {
  title: "Contribute",
  description,
  alternates: localizedAlternates("en", paths),
  openGraph: {
    title: "Contribute to SanCrisGo",
    description,
    locale: "en_US",
    alternateLocale: ["es_MX"],
    ...(canonical && { url: canonical }),
  },
};

export default function ContributePage() {
  return <ContributionContent locale="en" />;
}
