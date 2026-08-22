import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { localEventDateTimeToISOString } from "@/lib/events/date-filter";
import type { GeneratedEventAiPrefill } from "@/lib/events/event-ai-prefill";
import {
  eventAiPrefillSchema,
  normalizeEventAiPrefill,
  type EventAiPrefill,
} from "@/lib/events/event-ai-schema";
import type { EventRecurrenceFrequency } from "@/lib/events/recurrence";
import {
  createEventMediaSignedUrls,
  EVENT_MEDIA_BUCKET,
  EVENT_PUBLIC_MEDIA_BUCKET,
} from "@/lib/supabase/event-media";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

const CLOSED_CANDIDATE_STATUSES = ["pending", "approved", "rejected"];
const QUEUE_LIMIT = 200;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type WebsiteQueueState = "unreviewed" | "draft" | "published" | "skipped";

type CandidateMessageRow = {
  media_path: string | null;
  sequence: number;
};

type CandidateRow = {
  id: string;
  status: string;
  original_text: string;
  media_path: string | null;
  source_group_name: string | null;
  source_sender_name: string | null;
  created_at: string;
  event_candidate_messages?: CandidateMessageRow[];
};

type PublicationRow = {
  candidate_id: string;
  event_id: string | null;
  status: string;
  error: string | null;
  published_at: string | null;
};

type EventSummaryRow = {
  id: string;
  title: string;
  slug: string;
  starts_on: string;
  publication_status: string;
};

export type WebsiteQueueItem = {
  candidateId: string;
  candidateStatus: string;
  originalText: string;
  sourceGroupName: string | null;
  sourceSenderName: string | null;
  createdAt: string;
  mediaCount: number;
  previewUrl: string | null;
  state: WebsiteQueueState;
  eventId: string | null;
  eventTitle: string | null;
  startsOn: string | null;
  publicationError: string | null;
};

export type EventDraftRow = {
  id: string;
  title: string;
  title_es: string | null;
  slug: string;
  event_type: string;
  summary: string | null;
  summary_es: string | null;
  description: string | null;
  description_es: string | null;
  place_id: string | null;
  venue_name: string | null;
  address: string | null;
  starts_on: string;
  starts_at: string | null;
  ends_on: string | null;
  ends_at: string | null;
  recurrence_frequency: EventRecurrenceFrequency;
  recurrence_until: string | null;
  price_text: string | null;
  price_text_es: string | null;
  contact_phone: string | null;
  ticket_url: string | null;
  organizer_name: string | null;
  organizer_url: string | null;
  source_url: string | null;
  source_language: string;
  publication_status: string;
};

export type EventAiPrefillRow = {
  status: "ready" | "failed";
  model: string;
  result: EventAiPrefill | null;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number | null;
  errorClass: string | null;
  analyzedAt: string;
};

export type WebsiteCandidateDetail = {
  candidate: CandidateRow;
  media: Array<{ path: string; sequence: number; signedUrl: string }>;
  publication: PublicationRow | null;
  event: EventDraftRow | null;
  aiPrefill: EventAiPrefillRow | null;
  state: WebsiteQueueState;
};

export type EventDraftInput = {
  title: string;
  titleEs: string | null;
  slug: string;
  eventType: string;
  summary: string | null;
  summaryEs: string | null;
  description: string | null;
  descriptionEs: string | null;
  placeId: string | null;
  venueName: string | null;
  address: string | null;
  startsOn: string;
  startsAt: string | null;
  endsOn: string | null;
  endsAt: string | null;
  recurrenceFrequency: EventRecurrenceFrequency;
  recurrenceUntil: string | null;
  priceText: string | null;
  priceTextEs: string | null;
  contactPhone: string | null;
  ticketUrl: string | null;
  organizerName: string | null;
  organizerUrl: string | null;
  sourceUrl: string | null;
  sourceLanguage: string;
};

export class EventWebsiteAdminError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "EventWebsiteAdminError";
  }
}

export function websiteQueueState(
  publication: Pick<PublicationRow, "status"> | null,
  skipped: boolean,
): WebsiteQueueState {
  if (publication?.status === "published") return "published";
  if (publication) return "draft";
  return skipped ? "skipped" : "unreviewed";
}

function optionalText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function requiredText(formData: FormData, name: string, label: string): string {
  const value = optionalText(formData.get(name));
  if (!value) throw new EventWebsiteAdminError(`${label} is required.`);
  return value;
}

function optionalHttpUrl(formData: FormData, name: string, label: string): string | null {
  const value = optionalText(formData.get(name));
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
    return url.toString();
  } catch {
    throw new EventWebsiteAdminError(`${label} must be an http or https URL.`);
  }
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() + 1 === month
    && parsed.getUTCDate() === day;
}

export function slugifyEvent(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function parseEventDraftForm(formData: FormData, candidateId: string): EventDraftInput {
  const title = requiredText(formData, "title", "Title");
  const startsOn = requiredText(formData, "starts_on", "Start date");
  if (!validDate(startsOn)) throw new EventWebsiteAdminError("Start date is invalid.");

  const startsTime = optionalText(formData.get("starts_time"));
  const endsDateInput = optionalText(formData.get("ends_on"));
  const endsTime = optionalText(formData.get("ends_time"));
  const endsOn = endsDateInput ?? (endsTime ? startsOn : null);

  if (endsOn && !validDate(endsOn)) throw new EventWebsiteAdminError("End date is invalid.");
  if (endsOn && endsOn < startsOn) {
    throw new EventWebsiteAdminError("End date cannot be before the start date.");
  }
  if (endsTime && !startsTime) {
    throw new EventWebsiteAdminError("Add a start time before adding an end time.");
  }

  const startsAt = startsTime
    ? localEventDateTimeToISOString(startsOn, startsTime)
    : null;
  const endsAt = endsTime && endsOn
    ? localEventDateTimeToISOString(endsOn, endsTime)
    : null;

  if (startsTime && !startsAt) throw new EventWebsiteAdminError("Start time is invalid.");
  if (endsTime && !endsAt) throw new EventWebsiteAdminError("End time is invalid.");
  if (startsAt && endsAt && endsAt < startsAt) {
    throw new EventWebsiteAdminError("End time cannot be before the start time.");
  }

  const repeatsWeekly = formData.get("repeats_weekly") === "weekly";
  const recurrenceUntil = optionalText(formData.get("recurrence_until"));
  if (recurrenceUntil && !validDate(recurrenceUntil)) {
    throw new EventWebsiteAdminError("Recurrence end date is invalid.");
  }
  if (recurrenceUntil && !repeatsWeekly) {
    throw new EventWebsiteAdminError("Enable weekly recurrence before adding a recurrence end date.");
  }
  if (recurrenceUntil && recurrenceUntil < startsOn) {
    throw new EventWebsiteAdminError("Recurrence end date cannot be before the start date.");
  }

  const requestedSlug = optionalText(formData.get("slug"));
  const generatedSlug = [slugifyEvent(title) || "event", startsOn, candidateId.slice(0, 6)]
    .join("-")
    .slice(0, 120);
  const slug = requestedSlug ? slugifyEvent(requestedSlug) : generatedSlug;
  if (!slug) throw new EventWebsiteAdminError("Slug is invalid.");

  const language = optionalText(formData.get("source_language")) ?? "es";
  if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(language)) {
    throw new EventWebsiteAdminError("Source language is invalid.");
  }
  const placeId = optionalText(formData.get("place_id"));
  if (placeId && !UUID_PATTERN.test(placeId)) {
    throw new EventWebsiteAdminError("Selected Place is invalid.");
  }

  return {
    title,
    titleEs: optionalText(formData.get("title_es")),
    slug,
    eventType: optionalText(formData.get("event_type")) ?? "other",
    summary: optionalText(formData.get("summary")),
    summaryEs: optionalText(formData.get("summary_es")),
    description: optionalText(formData.get("description")),
    descriptionEs: optionalText(formData.get("description_es")),
    placeId,
    venueName: optionalText(formData.get("venue_name")),
    address: optionalText(formData.get("address")),
    startsOn,
    startsAt,
    endsOn,
    endsAt,
    recurrenceFrequency: repeatsWeekly ? "weekly" : "none",
    recurrenceUntil: repeatsWeekly ? recurrenceUntil : null,
    priceText: optionalText(formData.get("price_text")),
    priceTextEs: optionalText(formData.get("price_text_es")),
    contactPhone: optionalText(formData.get("contact_phone")),
    ticketUrl: optionalHttpUrl(formData, "ticket_url", "Ticket URL"),
    organizerName: optionalText(formData.get("organizer_name")),
    organizerUrl: optionalHttpUrl(formData, "organizer_url", "Organizer URL"),
    sourceUrl: optionalHttpUrl(formData, "source_url", "Source URL"),
    sourceLanguage: language,
  };
}

function mediaFromCandidate(candidate: CandidateRow): Array<{ path: string; sequence: number }> {
  const media = (candidate.event_candidate_messages ?? [])
    .filter((message): message is CandidateMessageRow & { media_path: string } => (
      typeof message.media_path === "string" && message.media_path.trim() !== ""
    ))
    .sort((left, right) => left.sequence - right.sequence)
    .map((message, index) => ({ path: message.media_path, sequence: index }));

  if (media.length === 0 && candidate.media_path) {
    media.push({ path: candidate.media_path, sequence: 0 });
  }

  return media.slice(0, 10);
}

function publicMediaDestination(eventId: string, sequence: number, sourcePath: string): string {
  const extension = /\.(jpe?g|png|webp)$/i.exec(sourcePath)?.[1].toLowerCase() ?? "jpg";
  return `${eventId}/${sequence.toString().padStart(2, "0")}.${extension}`;
}

export class EventWebsiteAdminService {
  constructor(private readonly client: SupabaseClient = createServiceRoleSupabaseClient()) {}

  async getQueue(includePreviews = true): Promise<WebsiteQueueItem[]> {
    const { data: candidateData, error: candidateError } = await this.client
      .from("event_candidates")
      .select("id,status,original_text,media_path,source_group_name,source_sender_name,created_at,event_candidate_messages(media_path,sequence)")
      .in("status", CLOSED_CANDIDATE_STATUSES)
      .order("created_at", { ascending: false })
      .limit(QUEUE_LIMIT);
    if (candidateError) throw new EventWebsiteAdminError("Could not load the website event queue.");

    const candidates = (candidateData ?? []) as CandidateRow[];
    if (candidates.length === 0) return [];
    const ids = candidates.map((candidate) => candidate.id);

    const [publicationResult, skipResult] = await Promise.all([
      this.client
        .from("event_publications")
        .select("candidate_id,event_id,status,error,published_at")
        .eq("channel", "website")
        .in("candidate_id", ids),
      this.client
        .from("event_candidate_website_skips")
        .select("candidate_id")
        .in("candidate_id", ids),
    ]);
    if (publicationResult.error || skipResult.error) {
      throw new EventWebsiteAdminError("Could not load website review decisions.");
    }

    const publications = (publicationResult.data ?? []) as PublicationRow[];
    const publicationByCandidate = new Map(publications.map((row) => [row.candidate_id, row]));
    const skippedIds = new Set((skipResult.data ?? []).map((row) => row.candidate_id as string));
    const eventIds = publications.flatMap((row) => row.event_id ? [row.event_id] : []);

    let events: EventSummaryRow[] = [];
    if (eventIds.length > 0) {
      const { data, error } = await this.client
        .from("events")
        .select("id,title,slug,starts_on,publication_status")
        .in("id", eventIds);
      if (error) throw new EventWebsiteAdminError("Could not load website event drafts.");
      events = (data ?? []) as EventSummaryRow[];
    }

    const eventById = new Map(events.map((event) => [event.id, event]));
    const previewPaths = includePreviews
      ? candidates.flatMap((candidate) => mediaFromCandidate(candidate).slice(0, 1).map((item) => item.path))
      : [];
    const signedUrls = await createEventMediaSignedUrls(previewPaths, 1800, this.client);

    return candidates.map((candidate) => {
      const publication = publicationByCandidate.get(candidate.id) ?? null;
      const event = publication?.event_id ? eventById.get(publication.event_id) ?? null : null;
      const candidateMedia = mediaFromCandidate(candidate);
      const firstMedia = candidateMedia[0];

      return {
        candidateId: candidate.id,
        candidateStatus: candidate.status,
        originalText: candidate.original_text,
        sourceGroupName: candidate.source_group_name,
        sourceSenderName: candidate.source_sender_name,
        createdAt: candidate.created_at,
        mediaCount: candidateMedia.length,
        previewUrl: firstMedia ? signedUrls.get(firstMedia.path) ?? null : null,
        state: websiteQueueState(publication, skippedIds.has(candidate.id)),
        eventId: event?.id ?? null,
        eventTitle: event?.title ?? null,
        startsOn: event?.starts_on ?? null,
        publicationError: publication?.error ?? null,
      };
    });
  }

  async getCandidateDetail(candidateId: string): Promise<WebsiteCandidateDetail | null> {
    const { data, error } = await this.client
      .from("event_candidates")
      .select("id,status,original_text,media_path,source_group_name,source_sender_name,created_at,event_candidate_messages(media_path,sequence)")
      .eq("id", candidateId)
      .in("status", CLOSED_CANDIDATE_STATUSES)
      .maybeSingle();
    if (error) throw new EventWebsiteAdminError("Could not load the event candidate.");
    if (!data) return null;

    const candidate = data as CandidateRow;
    const [publicationResult, skipResult, aiPrefillResult] = await Promise.all([
      this.client
        .from("event_publications")
        .select("candidate_id,event_id,status,error,published_at")
        .eq("candidate_id", candidateId)
        .eq("channel", "website")
        .maybeSingle(),
      this.client
        .from("event_candidate_website_skips")
        .select("candidate_id")
        .eq("candidate_id", candidateId)
        .maybeSingle(),
      this.client
        .from("event_candidate_ai_prefills")
        .select("status,model,result,input_tokens,output_tokens,estimated_cost_usd,error_class,analyzed_at")
        .eq("candidate_id", candidateId)
        .maybeSingle(),
    ]);
    if (publicationResult.error || skipResult.error || aiPrefillResult.error) {
      throw new EventWebsiteAdminError("Could not load the website review state.");
    }

    const publication = publicationResult.data as PublicationRow | null;
    let event: EventDraftRow | null = null;
    if (publication?.event_id) {
      const { data: eventData, error: eventError } = await this.client
        .from("events")
        .select("id,title,title_es,slug,event_type,summary,summary_es,description,description_es,place_id,venue_name,address,starts_on,starts_at,ends_on,ends_at,recurrence_frequency,recurrence_until,price_text,price_text_es,contact_phone,ticket_url,organizer_name,organizer_url,source_url,source_language,publication_status")
        .eq("id", publication.event_id)
        .maybeSingle();
      if (eventError) throw new EventWebsiteAdminError("Could not load the website event draft.");
      event = eventData as EventDraftRow | null;
    }

    const candidateMedia = mediaFromCandidate(candidate);
    const signedUrls = await createEventMediaSignedUrls(
      candidateMedia.map((item) => item.path),
      3600,
      this.client,
    );
    const storedPrefill = aiPrefillResult.data as {
      status: "ready" | "failed";
      model: string;
      result: unknown;
      input_tokens: number;
      output_tokens: number;
      estimated_cost_usd: number | string | null;
      error_class: string | null;
      analyzed_at: string;
    } | null;
    const compatibleStoredResult = storedPrefill?.result
      && typeof storedPrefill.result === "object"
      && !Array.isArray(storedPrefill.result)
      ? {
          recurrence_frequency: null,
          recurrence_until: null,
          ...storedPrefill.result,
        }
      : storedPrefill?.result;
    const parsedPrefill = storedPrefill?.status === "ready"
      ? eventAiPrefillSchema.safeParse(compatibleStoredResult)
      : null;
    const aiPrefill: EventAiPrefillRow | null = storedPrefill ? {
      status: parsedPrefill?.success === false ? "failed" : storedPrefill.status,
      model: storedPrefill.model,
      result: parsedPrefill?.success ? normalizeEventAiPrefill(parsedPrefill.data) : null,
      inputTokens: storedPrefill.input_tokens,
      outputTokens: storedPrefill.output_tokens,
      estimatedCostUsd: storedPrefill.estimated_cost_usd === null
        ? null
        : Number(storedPrefill.estimated_cost_usd),
      errorClass: parsedPrefill?.success === false
        ? "InvalidStoredResult"
        : storedPrefill.error_class,
      analyzedAt: storedPrefill.analyzed_at,
    } : null;

    return {
      candidate,
      media: candidateMedia.map((item) => ({
        ...item,
        signedUrl: signedUrls.get(item.path) ?? "",
      })).filter((item) => item.signedUrl),
      publication,
      event,
      aiPrefill,
      state: websiteQueueState(publication, skipResult.data !== null),
    };
  }

  async saveAiPrefill(candidateId: string, generated: GeneratedEventAiPrefill): Promise<void> {
    const { error } = await this.client.from("event_candidate_ai_prefills").upsert({
      candidate_id: candidateId,
      status: "ready",
      model: generated.model,
      result: generated.result,
      input_tokens: generated.inputTokens,
      output_tokens: generated.outputTokens,
      estimated_cost_usd: generated.estimatedCostUsd,
      error_class: null,
      analyzed_at: new Date().toISOString(),
    });
    if (error) throw new EventWebsiteAdminError("Could not save the AI suggestions.");
  }

  async saveAiPrefillFailure(candidateId: string, model: string, errorClass: string): Promise<void> {
    const { error } = await this.client.from("event_candidate_ai_prefills").upsert({
      candidate_id: candidateId,
      status: "failed",
      model,
      result: null,
      input_tokens: 0,
      output_tokens: 0,
      estimated_cost_usd: null,
      error_class: errorClass,
      analyzed_at: new Date().toISOString(),
    });
    if (error) throw new EventWebsiteAdminError("Could not save the AI analysis status.");
  }

  async saveDraft(candidateId: string, actorId: string, input: EventDraftInput) {
    const { data: candidate, error: candidateError } = await this.client
      .from("event_candidates")
      .select("id")
      .eq("id", candidateId)
      .in("status", CLOSED_CANDIDATE_STATUSES)
      .maybeSingle<{ id: string }>();
    if (candidateError || !candidate) throw new EventWebsiteAdminError("Event candidate was not found.");

    const { data: existingPublication, error: publicationError } = await this.client
      .from("event_publications")
      .select("event_id,status")
      .eq("candidate_id", candidateId)
      .eq("channel", "website")
      .maybeSingle<{ event_id: string | null; status: string }>();
    if (publicationError) throw new EventWebsiteAdminError("Could not load the website publication.");

    const eventValues = {
      title: input.title,
      title_es: input.titleEs,
      slug: input.slug,
      event_type: input.eventType,
      summary: input.summary,
      summary_es: input.summaryEs,
      description: input.description,
      description_es: input.descriptionEs,
      place_id: input.placeId,
      venue_name: input.venueName,
      address: input.address,
      starts_on: input.startsOn,
      starts_at: input.startsAt,
      ends_on: input.endsOn,
      ends_at: input.endsAt,
      recurrence_frequency: input.recurrenceFrequency,
      recurrence_until: input.recurrenceUntil,
      price_text: input.priceText,
      price_text_es: input.priceTextEs,
      contact_phone: input.contactPhone,
      ticket_url: input.ticketUrl,
      organizer_name: input.organizerName,
      organizer_url: input.organizerUrl,
      source_url: input.sourceUrl,
      source_language: input.sourceLanguage,
      created_by: actorId,
    };

    let eventId = existingPublication?.event_id ?? null;
    if (eventId) {
      const { error } = await this.client.from("events").update(eventValues).eq("id", eventId);
      if (error) throw new EventWebsiteAdminError("Could not update the website event draft.");
    } else {
      const { data, error } = await this.client
        .from("events")
        .insert({ ...eventValues, publication_status: "draft", published_at: null })
        .select("id")
        .single<{ id: string }>();
      if (error || !data) throw new EventWebsiteAdminError("Could not create the website event draft.");
      eventId = data.id;
    }

    const publicationStatus = existingPublication?.status === "published" ? "published" : "pending";
    const { error: upsertError } = await this.client.from("event_publications").upsert(
      {
        candidate_id: candidateId,
        event_id: eventId,
        channel: "website",
        status: publicationStatus,
        published_at: publicationStatus === "published" ? undefined : null,
        error: null,
      },
      { onConflict: "candidate_id,channel" },
    );
    if (upsertError) throw new EventWebsiteAdminError("Could not save the website publication draft.");

    await this.client
      .from("event_candidate_website_skips")
      .delete()
      .eq("candidate_id", candidateId);

    return { eventId, slug: input.slug };
  }

  async publish(candidateId: string, actorId: string, input: EventDraftInput) {
    const saved = await this.saveDraft(candidateId, actorId, input);
    const detail = await this.getCandidateDetail(candidateId);
    if (!detail || detail.media.length === 0) {
      throw new EventWebsiteAdminError("At least one candidate image is required for website publication.");
    }

    try {
      const mediaRows = [];
      for (const item of detail.media) {
        const destination = publicMediaDestination(saved.eventId, item.sequence, item.path);
        const { error } = await this.client.storage
          .from(EVENT_MEDIA_BUCKET)
          .copy(item.path, destination, {
            destinationBucket: EVENT_PUBLIC_MEDIA_BUCKET,
          });
        if (error && !await this.publicObjectExists(destination)) throw error;
        mediaRows.push({
          event_id: saved.eventId,
          storage_path: destination,
          sort_order: item.sequence,
          alt_text: input.title,
        });
      }

      const { error: mediaError } = await this.client
        .from("event_media")
        .upsert(mediaRows, { onConflict: "event_id,sort_order" });
      if (mediaError) throw mediaError;

      const { error: coverError } = await this.client
        .from("events")
        .update({ cover_image_path: mediaRows[0].storage_path })
        .eq("id", saved.eventId);
      if (coverError) throw coverError;

      const { error: publishError } = await this.client.rpc("publish_event_to_website", {
        candidate_id_input: candidateId,
        event_id_input: saved.eventId,
        actor_id_input: actorId,
      });
      if (publishError) throw publishError;
    } catch (error) {
      await this.client
        .from("event_publications")
        .update({
          status: "failed",
          published_at: null,
          error: "Website publication failed. It is safe to retry.",
        })
        .eq("candidate_id", candidateId)
        .eq("channel", "website");
      throw new EventWebsiteAdminError("Website publication failed. It is safe to retry.", { cause: error });
    }

    return saved;
  }

  async skip(candidateId: string, actorId: string): Promise<void> {
    const { data: publication, error: publicationError } = await this.client
      .from("event_publications")
      .select("status")
      .eq("candidate_id", candidateId)
      .eq("channel", "website")
      .maybeSingle<{ status: string }>();
    if (publicationError) throw new EventWebsiteAdminError("Could not load the website publication.");
    if (publication?.status === "published") {
      throw new EventWebsiteAdminError("A published website event cannot be skipped.");
    }

    const { error } = await this.client.from("event_candidate_website_skips").upsert({
      candidate_id: candidateId,
      skipped_by: actorId,
    });
    if (error) throw new EventWebsiteAdminError("Could not skip the website event candidate.");
  }

  private async publicObjectExists(storagePath: string): Promise<boolean> {
    const separator = storagePath.lastIndexOf("/");
    const folder = separator >= 0 ? storagePath.slice(0, separator) : "";
    const filename = separator >= 0 ? storagePath.slice(separator + 1) : storagePath;
    const { data, error } = await this.client.storage
      .from(EVENT_PUBLIC_MEDIA_BUCKET)
      .list(folder, { search: filename, limit: 10 });
    return !error && (data ?? []).some((object) => object.name === filename);
  }
}
