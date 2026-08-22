import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { EVENT_TIME_ZONE } from "@/lib/events/date-filter";
import { EventWebsiteAdminService } from "@/lib/events/website-admin";
import { AdminPlacesService } from "@/lib/places/admin-places";
import { analyzeWebsiteCandidate, publishWebsiteEvent, saveEventDraft } from "../actions";
import { AiAnalyzeForm } from "./ai-analyze-form";

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
  const [detail, placeOptions] = await Promise.all([
    new EventWebsiteAdminService().getCandidateDetail(candidateId),
    new AdminPlacesService().getOptions(),
  ]);
  if (!detail) notFound();

  const event = detail.event;
  const prefill = detail.aiPrefill?.status === "ready" ? detail.aiPrefill.result : null;
  const title = event ? event.title : prefill?.title ?? "";
  const titleEs = (event ? event.title_es : prefill?.title_es) ?? "";
  const startsOn = event ? event.starts_on : prefill?.starts_on ?? "";
  const startsTime = event ? timeInput(event.starts_at) : prefill?.starts_time ?? "";
  const endsOn = event ? event.ends_on ?? "" : prefill?.ends_on ?? "";
  const endsTime = event ? timeInput(event.ends_at) : prefill?.ends_time ?? "";
  const repeatsWeekly = event
    ? event.recurrence_frequency === "weekly"
    : prefill?.recurrence_frequency === "weekly";
  const recurrenceUntil = event
    ? event.recurrence_until ?? ""
    : prefill?.recurrence_until ?? "";
  const eventType = event ? event.event_type : prefill?.event_type ?? "other";
  const sourceLanguage = event
    ? event.source_language
    : prefill?.source_language === "en" ? "en" : "es";
  const venueName = event ? event.venue_name ?? "" : prefill?.venue_name ?? "";
  const address = event ? event.address ?? "" : prefill?.address ?? "";
  const priceText = event ? event.price_text ?? "" : prefill?.price_text ?? "";
  const priceTextEs = event ? event.price_text_es ?? "" : prefill?.price_text_es ?? "";
  const contactPhone = event ? event.contact_phone ?? "" : prefill?.contact_phone ?? "";
  const summary = event ? event.summary ?? "" : prefill?.summary ?? "";
  const summaryEs = event ? event.summary_es ?? "" : prefill?.summary_es ?? "";
  const description = event
    ? event.description ?? ""
    : prefill?.description ?? detail.candidate.original_text;
  const descriptionEs = event
    ? event.description_es ?? ""
    : prefill?.description_es ?? detail.candidate.original_text;
  const sourceUrl = event ? event.source_url ?? "" : prefill?.source_url ?? "";
  const ticketUrl = event ? event.ticket_url ?? "" : prefill?.ticket_url ?? "";
  const organizerName = event ? event.organizer_name ?? "" : prefill?.organizer_name ?? "";
  const organizerUrl = event ? event.organizer_url ?? "" : prefill?.organizer_url ?? "";
  const linkedPlace = event?.place_id
    ? placeOptions.find((place) => place.id === event.place_id) ?? null
    : null;
  const status = single(query.status);
  const error = single(query.error);

  return (
    <article className="admin-page admin-editor">
      <Link className="back-link" href="/admin/events">← Event queue</Link>
      <header className="admin-editor-heading">
        <div>
          <p className="eyebrow">Website event · {detail.state}</p>
          <h1>{event?.title || prefill?.title || "Review candidate"}</h1>
        </div>
        {event?.publication_status === "published" && (
          <Link href={`/events/${event.slug}`} target="_blank">View public page ↗</Link>
        )}
      </header>

      {status === "saved" && <p className="admin-success">Draft saved.</p>}
      {status === "ai-ready" && <p className="admin-success">AI suggestions are ready in the form below.</p>}
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

      <section aria-labelledby="ai-prefill-heading" className="admin-ai-panel">
        <div>
          <h2 id="ai-prefill-heading">AI prefill</h2>
          <p>
            Event facts are extracted automatically from the caption and flyer. Review every field before saving or publishing.
          </p>
          {event && <small>Re-analysis will not overwrite this saved draft.</small>}
          {detail.aiPrefill?.status === "ready" && (
            <p className="admin-ai-meta">
              {detail.aiPrefill.model} · {detail.aiPrefill.inputTokens + detail.aiPrefill.outputTokens} tokens
              {detail.aiPrefill.estimatedCostUsd !== null
                ? ` · about $${detail.aiPrefill.estimatedCostUsd.toFixed(6)}`
                : ""}
            </p>
          )}
          {detail.aiPrefill?.status === "failed" && (
            <p className="admin-ai-error">Last attempt failed ({detail.aiPrefill.errorClass || "unknown error"}).</p>
          )}
          {prefill && prefill.warnings.length > 0 && (
            <ul className="admin-ai-warnings">
              {prefill.warnings.map((warning) => <li key={warning}>{warning}</li>)}
            </ul>
          )}
        </div>
        <AiAnalyzeForm
          action={analyzeWebsiteCandidate}
          autoStart={!detail.aiPrefill}
          candidateId={candidateId}
          hasPrefill={Boolean(detail.aiPrefill)}
        />
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
            Event title (English)
            <input name="title" defaultValue={title} required />
          </label>
          <label className="admin-field-wide">
            Event title (Spanish)
            <input name="title_es" defaultValue={titleEs} />
          </label>
          <label>
            Date
            <input name="starts_on" type="date" defaultValue={startsOn} required />
          </label>
          <label>
            Time (optional)
            <input name="starts_time" type="time" defaultValue={startsTime} />
            <small>Leave empty to show “Time to be confirmed”.</small>
          </label>
          <label>
            Category
            <input name="event_type" defaultValue={eventType} required />
          </label>
          <label>
            Source language
            <select name="source_language" defaultValue={sourceLanguage}>
              <option value="es">Spanish</option>
              <option value="en">English</option>
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Time and place</legend>
          <label>
            End date (optional)
            <input name="ends_on" type="date" defaultValue={endsOn} />
          </label>
          <label>
            End time (optional)
            <input name="ends_time" type="time" defaultValue={endsTime} />
          </label>
          <label className="admin-recurrence-toggle">
            <span>Schedule</span>
            <span>
              <input
                name="repeats_weekly"
                type="checkbox"
                value="weekly"
                defaultChecked={repeatsWeekly}
              />
              Repeats weekly
            </span>
            <small>The weekday is taken from the start date.</small>
          </label>
          <label>
            Repeats until (optional)
            <input name="recurrence_until" type="date" defaultValue={recurrenceUntil} />
            <small>Leave empty only when no reliable end date is known.</small>
          </label>
          <label>
            Structured Place (optional)
            <select name="place_id" defaultValue={event?.place_id ?? ""}>
              <option value="">No structured Place</option>
              {placeOptions.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name} · {place.place_type} · {place.publication_status}
                </option>
              ))}
            </select>
            <small>Venue and address remain available as public fallback text.</small>
            {linkedPlace && (
              <Link className="admin-inline-action" href={`/admin/places/${linkedPlace.id}`}>
                Review linked Place: {linkedPlace.name}
              </Link>
            )}
            {event && !event.place_id && venueName && (
              <Link
                className="admin-inline-action"
                href={`/admin/places/venues?focus=${encodeURIComponent(event.slug)}`}
              >
                Link/create Place from this venue
              </Link>
            )}
          </label>
          <label>
            Venue
            <input name="venue_name" defaultValue={venueName} />
          </label>
          <label>
            Address
            <input name="address" defaultValue={address} />
          </label>
          <label>
            Price (English)
            <input name="price_text" defaultValue={priceText} placeholder="Free or MXN 150" />
          </label>
          <label>
            Price (Spanish)
            <input name="price_text_es" defaultValue={priceTextEs} placeholder="Gratis o MXN 150" />
          </label>
          <label className="admin-field-wide">
            Contact phone
            <input name="contact_phone" defaultValue={contactPhone} inputMode="tel" />
          </label>
        </fieldset>

        <fieldset>
          <legend>Public description</legend>
          <label className="admin-field-wide">
            Short summary (English)
            <textarea name="summary" rows={3} defaultValue={summary} />
          </label>
          <label className="admin-field-wide">
            Description (English)
            <textarea name="description" rows={10} defaultValue={description} />
          </label>
          <label className="admin-field-wide">
            Short summary (Spanish)
            <textarea name="summary_es" rows={3} defaultValue={summaryEs} />
          </label>
          <label className="admin-field-wide">
            Description (Spanish)
            <textarea name="description_es" rows={10} defaultValue={descriptionEs} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Links and organizer</legend>
          <label>
            Source URL
            <input name="source_url" type="url" defaultValue={sourceUrl} />
          </label>
          <label>
            Ticket URL
            <input name="ticket_url" type="url" defaultValue={ticketUrl} />
          </label>
          <label>
            Organizer name
            <input name="organizer_name" defaultValue={organizerName} />
          </label>
          <label>
            Organizer URL
            <input name="organizer_url" type="url" defaultValue={organizerUrl} />
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
