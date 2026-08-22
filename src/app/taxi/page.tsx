import type { Metadata } from "next";
import { TaxiContent } from "@/app/_components/taxi-content";
import { staticLocalizedPaths } from "@/lib/locales";
import { localizedAlternates } from "@/lib/localized-metadata";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const paths = staticLocalizedPaths("/taxi") as { en: string; es: string };
const canonical = getAbsoluteUrl(paths.en);
const description = "Contact a local taxi driver in San Cristóbal de las Casas through WhatsApp for rides, airport transfers, and private trips.";

export const metadata: Metadata = {
  title: "Taxi in San Cristóbal de las Casas",
  description,
  alternates: localizedAlternates("en", paths),
  openGraph: {
    title: "Taxi in San Cristóbal de las Casas",
    description: "Contact a local taxi driver in San Cristóbal de las Casas through WhatsApp.",
    locale: "en_US",
    alternateLocale: ["es_MX"],
    ...(canonical && { url: canonical }),
  },
};

export default function TaxiPage() {
  return <TaxiContent locale="en" />;
}
