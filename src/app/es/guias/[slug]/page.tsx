import type { Metadata } from "next";
import { GuideDetailContent } from "@/app/_components/guide-detail-content";
import { buildGuideMetadata } from "@/lib/guide-presentation";
import { getPublishedGuidePageData } from "@/lib/guides";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pageData = await getPublishedGuidePageData(slug, "es");
  return pageData ? buildGuideMetadata(pageData, "es") : { title: "Guía no encontrada" };
}

export default async function SpanishGuidePage({ params }: Props) {
  const { slug } = await params;
  return <GuideDetailContent locale="es" slug={slug} />;
}
