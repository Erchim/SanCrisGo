import type { Metadata } from "next";
import { HomeContent } from "@/app/_components/home-content";
import { staticLocalizedPaths } from "@/lib/locales";
import { localizedAlternates } from "@/lib/localized-metadata";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const paths = staticLocalizedPaths("/es") as { en: string; es: string };
const canonical = getAbsoluteUrl(paths.es);
const description = "Eventos y ayuda práctica para vivir y visitar San Cristóbal de las Casas, Chiapas.";

export const metadata: Metadata = {
  title: "SanCrisGo en español",
  description,
  alternates: localizedAlternates("es", paths),
  openGraph: {
    title: "SanCrisGo en español",
    description,
    locale: "es_MX",
    alternateLocale: ["en_US"],
    ...(canonical && { url: canonical }),
  },
};

export default function SpanishHome() {
  return <HomeContent locale="es" />;
}
