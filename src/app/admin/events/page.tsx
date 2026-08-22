import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import {
  EventWebsiteAdminService,
  type WebsiteQueueState,
} from "@/lib/events/website-admin";
import { signOut } from "@/app/admin/login/actions";
import { skipWebsiteCandidate } from "./actions";

export const metadata: Metadata = {
  title: "Website event queue",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    filter?: string | string[];
    status?: string | string[];
    error?: string | string[];
  }>;
};

const filters: Array<{ value: WebsiteQueueState; label: string }> = [
  { value: "unreviewed", label: "Needs review" },
  { value: "draft", label: "Drafts" },
  { value: "published", label: "Published" },
  { value: "skipped", label: "Skipped" },
];

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function queueFilter(value: string): WebsiteQueueState {
  return filters.some((filter) => filter.value === value)
    ? value as WebsiteQueueState
    : "unreviewed";
}

export default async function AdminEventsPage({ searchParams }: Props) {
  const admin = await requireAdmin();
  const [queue, params] = await Promise.all([
    new EventWebsiteAdminService().getQueue(),
    searchParams,
  ]);
  const activeFilter = queueFilter(single(params.filter));
  const visibleItems = queue.filter((item) => item.state === activeFilter);
  const counts: Record<WebsiteQueueState, number> = {
    unreviewed: 0,
    draft: 0,
    published: 0,
    skipped: 0,
  };
  queue.forEach((item) => { counts[item.state] += 1; });
  const status = single(params.status);
  const error = single(params.error);

  return (
    <section className="admin-page admin-queue">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Website publishing</p>
          <h1>Event queue</h1>
          <p className="lede">
            Review WhatsApp candidates here without changing their Instagram status.
          </p>
        </div>
        <div className="admin-heading-actions">
          <Link className="admin-secondary-link" href="/admin/places">Places</Link>
          <form action={signOut}>
            <button className="admin-secondary-button" type="submit">
              Sign out{admin.displayName ? ` · ${admin.displayName}` : ""}
            </button>
          </form>
        </div>
      </header>

      {status === "published" && <p className="admin-success">Event published on the website.</p>}
      {status === "skipped" && <p className="admin-success">Candidate removed from the review queue.</p>}
      {error && <p className="admin-alert" role="alert">{error}</p>}

      <nav className="admin-tabs" aria-label="Website event queue filters">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value === "unreviewed" ? "/admin/events" : `/admin/events?filter=${filter.value}`}
            aria-current={activeFilter === filter.value ? "page" : undefined}
          >
            {filter.label} <span>{counts[filter.value]}</span>
          </Link>
        ))}
      </nav>

      {visibleItems.length === 0 ? (
        <div className="events-empty">
          <h2>Nothing in this queue</h2>
          <p>The next closed WhatsApp candidates will appear automatically.</p>
        </div>
      ) : (
        <ul className="admin-candidate-list">
          {visibleItems.map((item) => (
            <li key={item.candidateId} className="admin-candidate-card">
              <div className="admin-candidate-preview">
                {item.previewUrl ? (
                  <Image
                    alt="Candidate event image"
                    src={item.previewUrl}
                    width={320}
                    height={320}
                    sizes="(max-width: 42rem) 100vw, 14rem"
                  />
                ) : <span>No image preview</span>}
                <small>{item.mediaCount} {item.mediaCount === 1 ? "image" : "images"}</small>
              </div>
              <div className="admin-candidate-content">
                <div className="admin-candidate-meta">
                  <span>{item.sourceGroupName || "Unknown group"}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString("en-CA")}</span>
                  <span>IG: {item.candidateStatus}</span>
                </div>
                <h2>{item.eventTitle || "Untitled candidate"}</h2>
                <p className="admin-original-text">
                  {item.originalText || "Candidate has no caption."}
                </p>
                {item.startsOn && <p><strong>Date:</strong> {item.startsOn}</p>}
                {item.publicationError && <p className="admin-alert">{item.publicationError}</p>}
                <div className="admin-card-actions">
                  <Link className="primary-link" href={`/admin/events/${item.candidateId}`}>
                    {item.state === "published" ? "Open event" : "Review and edit"}
                  </Link>
                  {item.state === "unreviewed" && (
                    <form action={skipWebsiteCandidate}>
                      <input name="candidate_id" type="hidden" value={item.candidateId} />
                      <button className="admin-text-button" type="submit">Skip for website</button>
                    </form>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
