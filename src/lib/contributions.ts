import type { Locale } from "@/lib/locales";

export const CONTRIBUTION_PHONE_DISPLAY = "967 192 2636";
export const CONTRIBUTION_WHATSAPP_NUMBER = "529671922636";

export type ContributionKind = "place" | "event" | "service" | "update";

const messages: Record<Locale, Record<ContributionKind, string>> = {
  en: {
    place: "Hi, I found SanCrisGo and I'd like to send information about a Place/business in San Cristóbal:",
    event: "Hi, I want to send an Event for SanCrisGo:",
    service: "Hi, I'd like to participate in SanCrisGo. I am / I offer:",
    update: "Hi, I'd like to suggest an update for SanCrisGo:",
  },
  es: {
    place: "Hola, vi SanCrisGo y quiero enviar información sobre un lugar/negocio en San Cristóbal:",
    event: "Hola, quiero enviar un evento para SanCrisGo:",
    service: "Hola, me gustaría participar en SanCrisGo. Soy / ofrezco:",
    update: "Hola, quiero sugerir una actualización para SanCrisGo:",
  },
};

export function normalizeWhatsAppNumber(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function buildWhatsAppUrl(phone: string, message = ""): string | null {
  const number = normalizeWhatsAppNumber(phone);
  if (!number) return null;
  const trimmedMessage = message.trim();
  return `https://wa.me/${number}${trimmedMessage ? `?text=${encodeURIComponent(trimmedMessage)}` : ""}`;
}

export function contributionMessage(kind: ContributionKind, locale: Locale): string {
  return messages[locale][kind];
}

export function contributionWhatsAppUrl(kind: ContributionKind, locale: Locale): string {
  return buildWhatsAppUrl(
    CONTRIBUTION_WHATSAPP_NUMBER,
    contributionMessage(kind, locale),
  ) as string;
}

export function correctionMessage(
  title: string,
  canonicalUrl: string,
  locale: Locale,
): string {
  return locale === "es"
    ? `Hola, encontré información que quizá necesite actualizarse en SanCrisGo: ${title} — ${canonicalUrl}`
    : `Hi, I found information that may need updating on SanCrisGo: ${title} — ${canonicalUrl}`;
}

export function correctionWhatsAppUrl(
  title: string,
  canonicalUrl: string,
  locale: Locale,
): string {
  return buildWhatsAppUrl(
    CONTRIBUTION_WHATSAPP_NUMBER,
    correctionMessage(title, canonicalUrl, locale),
  ) as string;
}
