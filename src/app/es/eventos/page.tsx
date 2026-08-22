import type { Metadata } from "next";
import { EventsIndexContent } from "@/app/_components/events-index-content";
import { staticLocalizedPaths } from "@/lib/locales";
import { localizedAlternates } from "@/lib/localized-metadata";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const paths = staticLocalizedPaths("/es/eventos") as { en: string; es: string };
const canonical = getAbsoluteUrl(paths.es);
const description = "Encuentra eventos para hoy, mañana y este fin de semana en San Cristóbal de las Casas.";

export const metadata: Metadata = {
  title: "Eventos en San Cristóbal de las Casas",
  description,
  alternates: localizedAlternates("es", paths),
  openGraph: {
    title: "Eventos en San Cristóbal de las Casas",
    description,
    locale: "es_MX",
    alternateLocale: ["en_US"],
    ...(canonical && { url: canonical }),
  },
};

type Props = {
  searchParams: Promise<{ view?: string | string[]; date?: string | string[] }>;
};

export default function SpanishEventsPage({ searchParams }: Props) {
  return <EventsIndexContent locale="es" searchParams={searchParams} />;
}
