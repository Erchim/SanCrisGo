import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { PlaceForm } from "@/app/admin/places/_components/place-form";

export const metadata: Metadata = {
  title: "New Place",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ error?: string | string[] }> };

export default async function NewPlacePage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  return <PlaceForm place={null} error={error} />;
}
