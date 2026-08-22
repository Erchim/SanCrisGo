import type { Metadata } from "next";
import { ContributionContent } from "@/app/_components/contribution-content";
import { staticLocalizedPaths } from "@/lib/locales";
import { localizedAlternates } from "@/lib/localized-metadata";
import { getAbsoluteUrl } from "@/lib/site-url";

const paths = staticLocalizedPaths("/es/participa") as { en: string; es: string };
const canonical = getAbsoluteUrl(paths.es);
const description = "Envía un lugar, evento, servicio local, foto o corrección a SanCrisGo mediante un flujo moderado por WhatsApp.";

export const metadata: Metadata = {
  title: "Participa",
  description,
  alternates: localizedAlternates("es", paths),
  openGraph: {
    title: "Participa en SanCrisGo",
    description,
    locale: "es_MX",
    alternateLocale: ["en_US"],
    ...(canonical && { url: canonical }),
  },
};

export default function SpanishContributePage() {
  return <ContributionContent locale="es" />;
}
