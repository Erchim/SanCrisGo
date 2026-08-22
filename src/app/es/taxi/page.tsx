import type { Metadata } from "next";
import { TaxiContent } from "@/app/_components/taxi-content";
import { staticLocalizedPaths } from "@/lib/locales";
import { localizedAlternates } from "@/lib/localized-metadata";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const paths = staticLocalizedPaths("/es/taxi") as { en: string; es: string };
const canonical = getAbsoluteUrl(paths.es);
const description = "Contacta por WhatsApp a un conductor de taxi local en San Cristóbal de las Casas para traslados, viajes al aeropuerto y viajes privados.";

export const metadata: Metadata = {
  title: "Taxi en San Cristóbal de las Casas",
  description,
  alternates: localizedAlternates("es", paths),
  openGraph: {
    title: "Taxi en San Cristóbal de las Casas",
    description: "Contacta por WhatsApp a un conductor de taxi local en San Cristóbal de las Casas.",
    locale: "es_MX",
    alternateLocale: ["en_US"],
    ...(canonical && { url: canonical }),
  },
};

export default function SpanishTaxiPage() {
  return <TaxiContent locale="es" />;
}
