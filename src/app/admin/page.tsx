import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const destinations = [
  {
    href: "/admin/events",
    eyebrow: "Publishing",
    title: "Events",
    description: "Review candidates, edit Event details and publish to the website.",
  },
  {
    href: "/admin/places",
    eyebrow: "Structured content",
    title: "Places",
    description: "Create, verify, publish and maintain canonical local Places.",
  },
  {
    href: "/admin/places/venues",
    eyebrow: "Data intake",
    title: "Unlinked venues",
    description: "Turn reviewed Event venue data into draft Places and structured links.",
  },
] as const;

export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <section className="admin-page admin-home">
      <AdminNav current="home" displayName={admin.displayName} />
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Staff workspace</p>
          <h1>SanCrisGo admin</h1>
          <p className="lede">Choose the area you need to review or maintain.</p>
        </div>
      </header>
      <ul className="admin-destination-list">
        {destinations.map((destination) => (
          <li key={destination.href}>
            <Link href={destination.href}>
              <span className="event-type">{destination.eyebrow}</span>
              <strong>{destination.title}</strong>
              <span>{destination.description}</span>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
