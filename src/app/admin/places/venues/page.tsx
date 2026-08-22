import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/app/admin/_components/admin-nav";
import { requireAdminContext } from "@/lib/admin-auth";
import { AdminPlacesService } from "@/lib/places/admin-places";
import { AdminVenueWorkflowService } from "@/lib/places/admin-venue-workflow";
import { possiblePlaceMatches } from "@/lib/places/venue-workflow";
import { linkVenueEvents, reviewVenueAsPlace } from "@/app/admin/places/venues/actions";

export const metadata: Metadata = {
  title: "Unlinked Event venues",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    focus?: string | string[];
    status?: string | string[];
    count?: string | string[];
    error?: string | string[];
  }>;
};

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function AdminVenueWorkspacePage({ searchParams }: Props) {
  const { identity: admin, client } = await requireAdminContext();
  const query = await searchParams;
  const placesService = new AdminPlacesService(client);
  const venueService = new AdminVenueWorkflowService(client, placesService);
  const [workspace, placeOptions, matchOptions] = await Promise.all([
    venueService.getWorkspace(),
    placesService.getOptions(),
    placesService.getMatchOptions(),
  ]);
  const focus = single(query.focus);
  const groups = focus
    ? [...workspace].sort((left, right) => (
      Number(right.unlinkedEvents.some((event) => event.slug === focus))
      - Number(left.unlinkedEvents.some((event) => event.slug === focus))
    ))
    : workspace;
  const linkedCount = single(query.count);
  const error = single(query.error);

  return (
    <section className="admin-page admin-venue-workspace">
      <AdminNav current="venues" displayName={admin.displayName} />
      <Link className="back-link" href="/admin/places">← Places</Link>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">Event data → structured Places</p>
          <h1>Unlinked venues</h1>
          <p className="lede">
            Review exact normalized venue groups, then link selected Events or create a draft Place.
          </p>
        </div>
        <Link className="admin-secondary-link" href="/admin/events">Event queue</Link>
      </header>

      {(single(query.status) === "linked" || single(query.status) === "created") && (
        <p className="admin-success">
          {single(query.status) === "created" ? "Created a draft Place and linked" : "Linked"}{" "}
          {linkedCount || "selected"} Event{linkedCount === "1" ? "" : "s"}.
        </p>
      )}
      {error && <p className="admin-alert" role="alert">{error}</p>}

      {groups.length === 0 ? (
        <div className="events-empty">
          <h2>No unlinked venue groups</h2>
          <p>Events with a usable venue name are already handled.</p>
        </div>
      ) : (
        <div className="admin-venue-groups">
          {groups.map((group) => {
            const matches = possiblePlaceMatches(group, matchOptions);
            return (
              <article className="admin-venue-group" key={group.key}>
                <header>
                  <div>
                    <p className="event-type">
                      {group.hasUpcomingPublishedEvent ? "Upcoming published Event" : "Venue candidate"}
                    </p>
                    <h2>{group.venueName}</h2>
                    {group.representativeAddress && <p>{group.representativeAddress}</p>}
                  </div>
                  <div className="admin-venue-status">
                    <strong>{group.unlinkedEvents.length} unlinked</strong>
                    <span>
                      {group.linkedEventCount > 0
                        ? `Partially handled · ${group.linkedEventCount} linked`
                        : "Unlinked"}
                    </span>
                  </div>
                </header>

                {matches.length > 0 && (
                  <aside className="admin-possible-matches">
                    <strong>Possible existing Place</strong>
                    <ul>
                      {matches.map((match) => (
                        <li key={match.id}>
                          <Link href={`/admin/places/${match.id}`}>{match.name}</Link>
                          <span>
                            {match.place_type} · {match.publication_status} · exact {match.signals.join(" + ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </aside>
                )}

                <form className="admin-venue-form">
                  <input name="venue_group_key" type="hidden" value={group.key} />
                  <fieldset>
                    <legend>Select Events to update</legend>
                    <div className="admin-venue-event-list">
                      {group.unlinkedEvents.map((event) => (
                        <div className="admin-venue-event-row" key={event.id}>
                          <label>
                            <input
                              name="selected_event_id"
                              type="checkbox"
                              value={event.id}
                              defaultChecked
                            />
                            <span>
                              <strong>{event.title}</strong>
                              <small>
                                {event.starts_on} · {event.publication_status}
                                {event.recurrence_frequency === "weekly" ? " · weekly series" : ""}
                              </small>
                            </span>
                          </label>
                          <span className="admin-venue-event-links">
                            {event.candidateId && (
                              <Link href={`/admin/events/${event.candidateId}`}>Review Event</Link>
                            )}
                            {event.publication_status === "published" && (
                              <Link href={`/events/${event.slug}`} target="_blank">Public page ↗</Link>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </fieldset>

                  <div className="admin-venue-actions">
                    <label>
                      Link to existing Place
                      <select name="existing_place_id" defaultValue="">
                        <option value="" disabled>Choose Place</option>
                        {placeOptions.filter((place) => place.publication_status !== "archived").map((place) => (
                          <option key={place.id} value={place.id}>
                            {place.name} · {place.place_type} · {place.publication_status}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="admin-secondary-button"
                      disabled={!placeOptions.some((place) => place.publication_status !== "archived")}
                      formAction={linkVenueEvents}
                      type="submit"
                    >
                      Link selected Events
                    </button>
                    <button formAction={reviewVenueAsPlace} type="submit">
                      Create draft Place
                    </button>
                  </div>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
