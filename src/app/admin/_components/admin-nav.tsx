import Link from "next/link";
import { signOut } from "@/app/admin/login/actions";

const sections = [
  { href: "/admin", label: "Admin home", key: "home" },
  { href: "/admin/events", label: "Events", key: "events" },
  { href: "/admin/places", label: "Places", key: "places" },
  { href: "/admin/places/venues", label: "Unlinked venues", key: "venues" },
] as const;

export type AdminSection = (typeof sections)[number]["key"];

export function AdminNav({
  current,
  displayName,
}: {
  current: AdminSection;
  displayName?: string | null;
}) {
  return (
    <div className="admin-global-nav">
      <nav aria-label="Admin sections">
        {sections.map((section) => (
          <Link
            aria-current={section.key === current ? "page" : undefined}
            href={section.href}
            key={section.key}
          >
            {section.label}
          </Link>
        ))}
      </nav>
      <form action={signOut}>
        <button className="admin-secondary-button" type="submit">
          Sign out{displayName ? ` · ${displayName}` : ""}
        </button>
      </form>
    </div>
  );
}
