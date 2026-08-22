import type { Metadata } from "next";
import { HomeContent } from "@/app/_components/home-content";
import { staticLocalizedPaths } from "@/lib/locales";
import { localizedAlternates } from "@/lib/localized-metadata";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const paths = staticLocalizedPaths("/") as { en: string; es: string };
const canonical = getAbsoluteUrl(paths.en);
const description = "Practical local guides and events in San Cristóbal de las Casas, Chiapas.";

export const metadata: Metadata = {
  description,
  alternates: localizedAlternates("en", paths),
  openGraph: {
    title: "SanCrisGo",
    description,
    locale: "en_US",
    alternateLocale: ["es_MX"],
    ...(canonical && { url: canonical }),
  },
};

export default function Home() {
  return <HomeContent locale="en" />;
}
