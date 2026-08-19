import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { EVENT_TIME_ZONE } from "@/lib/events/date-filter";
import { EventWebsiteAdminService } from "@/lib/events/website-admin";
import { publishWebsiteEvent, saveEventDraft } from "../actions";

export const metadata: Metadata = {
  title: "Edit website event",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ candidateId: string }>;
  searchParams: Promise<{ status?: string | string[]; error?: string | string[] }>;
};

const timeInputFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: EVENT_TIME_ZONE,
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

function timeInput(timestamp: string | null | undefined): string {
  return timestamp ? timeInputFormatter.format(new Date(timestamp)) : "";
}

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function AdminEventEditorPage({ params, searchParams }: Props) {
  await requireAdmin();
  const [{ candidateId }, query] = await Promise.all([params, searchParams]);
  const detail = await new EventWebsiteAdminService().getCandidateDetail(candidateId);
  if (!detail) notFound();

  const event = detail.event;
  const description = event?.description ?? detail.candidate.original_text;
  const status = single(query.status);
  const error = single(query.error);

  return (
    <article className="admin-page admin-editor">
      <Link className="back-link" href="/admin/events">← Event queue</Link>
      <header className="admin-editor-heading">
        <div>
          <p className="eyebrow">Website event · {detail.state}</p>
          <h1>{event?.title || "Review candidate"}</h1>
        </div>
        {event?.publication_status === "published" && (
          <Link href={`/events/${event.slug}`} target="_blank">View public page ↗</Link>
        )}
      </header>

      {status === "saved" && <p className="admin-success">Draft saved.</p>}
      {error && <p className="admin-alert" role="alert">{error}</p>}

      <section aria-labelledby="candidate-source-heading" className="admin-source-panel">
        <h2 id="candidate-source-heading">Original candidate</h2>
        <p>{detail.candidate.original_text || "Candidate has no caption."}</p>
        <p className="admin-candidate-meta">
          <span>{detail.candidate.source_group_name || "Unknown group"}</span>
          <span>{detail.candidate.source_sender_name || "Unknown sender"}</span>
          <span>Instagram status: {detail.candidate.status}</span>
        </p>
      </section>

      <section aria-labelledby="candidate-images-heading">
        <div className="section-heading">
          <h2 id="candidate-images-heading">Candidate images</h2>
          <span>{detail.media.length}/10</span>
        </div>
        <div className="admin-media-grid">
          {detail.media.map((media, index) => (
            <figure key={media.path}>
              <Image
                alt={`Candidate event image ${index + 1}`}
                src={media.signedUrl}
                width={640}
                height={640}
                sizes="(max-width: 40rem) 100vw, 24rem"
              />
              <figcaption>Image {index + 1}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <form className="admin-form admin-event-form">
        <input name="candidate_id" type="hidden" value={candidateId} />

        <fieldset>
          <legend>Required information</legend>
          <label className="admin-field-wide">
            Event title
            <input name="title" defaultValue={event?.title ?? ""} required />
          </label>
          <label>
            Date
            <input name="starts_on" type="date" defaultValue={event?.starts_on ?? ""} required />
          </label>
          <label>
            Time (optional)
            <input name="starts_time" type="time" defaultValue={timeInput(event?.starts_at)} />
            <small>Leave empty to show “Time to be confirmed”.</small>
          </label>
          <label>
            Category
            <input name="event_type" defaultValue={event?.event_type ?? "other"} required />
          </label>
          <label>
            Source language
            <select name="source_language" defaultValue={event?.source_language ?? "es"}>
              <option value="es">Spanish</option>
              <option value="en">English</option>
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Time and place</legend>
          <label>
            End date (optional)
            <input name="ends_on" type="date" defaultValue={event?.ends_on ?? ""} />
          </label>
          <label>
            End time (optional)
            <input name="ends_time" type="time" defaultValue={timeInput(event?.ends_at)} />
          </label>
          <label>
            Venue
            <input name="venue_name" defaultValue={event?.venue_name ?? ""} />
          </label>
          <label>
            Address
            <input name="address" defaultValue={event?.address ?? ""} />
          </label>
          <label>
            Price
            <input name="price_text" defaultValue={event?.price_text ?? ""} placeholder="Free or MXN 150" />
          </label>
        </fieldset>

        <fieldset>
          <legend>Public description</legend>
          <label className="admin-field-wide">
            Short summary
            <textarea name="summary" rows={3} defaultValue={event?.summary ?? ""} />
          </label>
          <label className="admin-field-wide">
            Description
            <textarea name="description" rows={10} defaultValue={description} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Links and organizer</legend>
          <label>
            Source URL
            <input name="source_url" type="url" defaultValue={event?.source_url ?? ""} />
          </label>
          <label>
            Ticket URL
            <input name="ticket_url" type="url" defaultValue={event?.ticket_url ?? ""} />
          </label>
          <label>
            Organizer name
            <input name="organizer_name" defaultValue={event?.organizer_name ?? ""} />
          </label>
          <label>
            Organizer URL
            <input name="organizer_url" type="url" defaultValue={event?.organizer_url ?? ""} />
          </label>
          <label className="admin-field-wide">
            URL slug
            <input name="slug" defaultValue={event?.slug ?? ""} placeholder="Generated automatically" />
          </label>
        </fieldset>

        <div className="admin-publish-actions">
          <button className="admin-secondary-button" formAction={saveEventDraft} type="submit">
            Save draft
          </button>
          <button formAction={publishWebsiteEvent} type="submit">
            {detail.state === "published" ? "Save and update website" : "Publish on website"}
          </button>
        </div>
      </form>
    </article>
  );
}
