import { z } from "zod";

export const EVENT_AI_TYPES = [
  "art",
  "community",
  "dance",
  "film",
  "food",
  "market",
  "music",
  "nightlife",
  "theater",
  "wellness",
  "workshop",
  "other",
] as const;

const nullableText = (maximum: number) => z.string().max(maximum).nullable();

export const eventAiPrefillSchema = z.object({
  title: nullableText(180).describe("Concise English event title."),
  title_es: nullableText(180).describe("Concise Spanish event title."),
  event_type: z.enum(EVENT_AI_TYPES).nullable(),
  summary: nullableText(260).describe("One factual sentence in English."),
  summary_es: nullableText(260).describe("One factual sentence in Spanish."),
  description: nullableText(1200).describe("Factual English description using only source facts."),
  description_es: nullableText(1200).describe("Factual Spanish description using only source facts."),
  venue_name: nullableText(180),
  address: nullableText(300),
  starts_on: nullableText(10).describe("Start date as YYYY-MM-DD."),
  starts_time: nullableText(5).describe("Local start time as HH:mm in 24-hour notation."),
  ends_on: nullableText(10).describe("End date as YYYY-MM-DD."),
  ends_time: nullableText(5).describe("Local end time as HH:mm in 24-hour notation."),
  price_text: nullableText(120).describe("English price text, preserving amounts and currency."),
  price_text_es: nullableText(120).describe("Spanish price text, preserving amounts and currency."),
  contact_phone: nullableText(80),
  ticket_url: nullableText(500),
  organizer_name: nullableText(180),
  organizer_url: nullableText(500),
  source_url: nullableText(500),
  source_language: z.enum(["es", "en", "unknown"]),
  warnings: z.array(z.string().max(220)).max(8),
}).strict();

export type EventAiPrefill = z.infer<typeof eventAiPrefillSchema>;

function cleanText(value: string | null): string | null {
  if (value === null) return null;
  const cleaned = value.trim();
  return cleaned || null;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() + 1 === month
    && parsed.getUTCDate() === day;
}

function cleanDate(value: string | null): string | null {
  const cleaned = cleanText(value);
  return cleaned && validDate(cleaned) ? cleaned : null;
}

function cleanTime(value: string | null): string | null {
  const cleaned = cleanText(value);
  if (!cleaned || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(cleaned)) return null;
  return cleaned;
}

function cleanHttpUrl(value: string | null): string | null {
  const cleaned = cleanText(value);
  if (!cleaned) return null;

  try {
    const url = new URL(cleaned);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeEventAiPrefill(value: unknown): EventAiPrefill {
  const parsed = eventAiPrefillSchema.parse(value);
  const startsOn = cleanDate(parsed.starts_on);
  const startsTime = cleanTime(parsed.starts_time);
  let endsOn = cleanDate(parsed.ends_on);
  let endsTime = cleanTime(parsed.ends_time);

  if (endsTime && !startsTime) endsTime = null;
  if (endsTime && !endsOn) endsOn = startsOn;
  if (endsOn && startsOn && endsOn < startsOn) {
    endsOn = null;
    endsTime = null;
  }

  return {
    title: cleanText(parsed.title),
    title_es: cleanText(parsed.title_es),
    event_type: parsed.event_type,
    summary: cleanText(parsed.summary),
    summary_es: cleanText(parsed.summary_es),
    description: cleanText(parsed.description),
    description_es: cleanText(parsed.description_es),
    venue_name: cleanText(parsed.venue_name),
    address: cleanText(parsed.address),
    starts_on: startsOn,
    starts_time: startsTime,
    ends_on: endsOn,
    ends_time: endsTime,
    price_text: cleanText(parsed.price_text),
    price_text_es: cleanText(parsed.price_text_es),
    contact_phone: cleanText(parsed.contact_phone),
    ticket_url: cleanHttpUrl(parsed.ticket_url),
    organizer_name: cleanText(parsed.organizer_name),
    organizer_url: cleanHttpUrl(parsed.organizer_url),
    source_url: cleanHttpUrl(parsed.source_url),
    source_language: parsed.source_language,
    warnings: [...new Set(parsed.warnings.map((warning) => warning.trim()).filter(Boolean))],
  };
}

export function mergeEventAiPrefills(
  primary: EventAiPrefill,
  secondary: EventAiPrefill,
): EventAiPrefill {
  const merged = { ...primary };
  for (const key of Object.keys(primary) as Array<keyof EventAiPrefill>) {
    if (key === "warnings") continue;
    if (key === "source_language") {
      if (merged.source_language === "unknown") merged.source_language = secondary.source_language;
      continue;
    }
    if (merged[key] === null && secondary[key] !== null) {
      Object.assign(merged, { [key]: secondary[key] });
    }
  }

  merged.warnings = [...new Set([...primary.warnings, ...secondary.warnings])].slice(0, 8);
  return normalizeEventAiPrefill(merged);
}

export function needsAnotherFlyerImage(prefill: EventAiPrefill): boolean {
  return prefill.title === null || prefill.starts_on === null;
}
