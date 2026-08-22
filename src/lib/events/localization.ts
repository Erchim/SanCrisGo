import type { Locale } from "@/lib/locales";

export type EventTextSource = {
  source_language: string;
  title: string;
  title_es: string | null;
  summary: string | null;
  summary_es: string | null;
  description?: string | null;
  description_es?: string | null;
  price_text: string | null;
  price_text_es: string | null;
};

export type LocalizedEventText = {
  title: string;
  summary: string | null;
  description: string | null;
  price_text: string | null;
};

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function isSpanishSourceLanguage(sourceLanguage: string): boolean {
  return /^es(?:-|$)/i.test(sourceLanguage.trim());
}

function spanishField(
  translated: string | null | undefined,
  base: string | null | undefined,
  sourceLanguage: string,
): string | null {
  return clean(translated)
    ?? (isSpanishSourceLanguage(sourceLanguage) ? clean(base) : null);
}

export function localizeEventText(
  event: EventTextSource,
  locale: Locale,
): LocalizedEventText | null {
  if (locale === "en") {
    return {
      title: event.title,
      summary: clean(event.summary),
      description: clean(event.description),
      price_text: clean(event.price_text),
    };
  }

  const title = spanishField(event.title_es, event.title, event.source_language);
  if (!title) return null;

  return {
    title,
    summary: spanishField(event.summary_es, event.summary, event.source_language),
    description: spanishField(event.description_es, event.description, event.source_language),
    price_text: spanishField(event.price_text_es, event.price_text, event.source_language),
  };
}

export function hasUsableSpanishEvent(event: EventTextSource): boolean {
  return localizeEventText(event, "es") !== null;
}
