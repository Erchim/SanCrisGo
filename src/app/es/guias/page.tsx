import type { Metadata } from "next";
import { GuidesIndexContent } from "@/app/_components/guides-index-content";
import { staticLocalizedPaths } from "@/lib/locales";
import { localizedAlternates } from "@/lib/localized-metadata";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
const paths = staticLocalizedPaths("/es/guias") as { en: string; es: string };
const canonical = getAbsoluteUrl(paths.es);
const description = "Guías prácticas para viajar y moverte por San Cristóbal de las Casas.";

export const metadata: Metadata = {
  title: "Guías",
  description,
  alternates: localizedAlternates("es", paths),
  openGraph: {
    title: "Guías",
    description,
    locale: "es_MX",
    alternateLocale: ["en_US"],
    ...(canonical && { url: canonical }),
  },
};

export default function SpanishGuidesPage() {
  return <GuidesIndexContent locale="es" />;
}
