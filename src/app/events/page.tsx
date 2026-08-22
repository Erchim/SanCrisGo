import type { Metadata } from "next";
import { EventsIndexContent } from "@/app/_components/events-index-content";
import { staticLocalizedPaths } from "@/lib/locales";
import { localizedAlternates } from "@/lib/localized-metadata";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const paths = staticLocalizedPaths("/events") as { en: string; es: string };
const canonical = getAbsoluteUrl(paths.en);
const description = "Find events happening today, tomorrow, and this weekend in San Cristóbal de las Casas.";

export const metadata: Metadata = {
  title: "Events in San Cristóbal de las Casas",
  description,
  alternates: localizedAlternates("en", paths),
  openGraph: {
    title: "Events in San Cristóbal de las Casas",
    description,
    locale: "en_US",
    alternateLocale: ["es_MX"],
    ...(canonical && { url: canonical }),
  },
};

type Props = {
  searchParams: Promise<{ view?: string | string[]; date?: string | string[] }>;
};

export default function EventsPage({ searchParams }: Props) {
  return <EventsIndexContent locale="en" searchParams={searchParams} />;
}
