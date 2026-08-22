import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceForm } from "@/app/admin/places/_components/place-form";
import { requireAdmin } from "@/lib/admin-auth";
import { AdminPlacesService } from "@/lib/places/admin-places";

export const metadata: Metadata = {
  title: "Edit Place",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<{ status?: string | string[]; error?: string | string[] }>;
};

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function EditPlacePage({ params, searchParams }: Props) {
  await requireAdmin();
  const [{ placeId }, query] = await Promise.all([params, searchParams]);
  const place = await new AdminPlacesService().getPlace(placeId);
  if (!place) notFound();

  return <PlaceForm place={place} status={single(query.status)} error={single(query.error)} />;
}
