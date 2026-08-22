import type { Metadata } from "next";
import {
  EventDetailContent,
  generateLocalizedEventMetadata,
} from "@/app/_components/event-detail-content";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return generateLocalizedEventMetadata(slug, "es");
}

export default function SpanishEventPage({ params, searchParams }: Props) {
  return <EventDetailContent locale="es" params={params} searchParams={searchParams} />;
}
