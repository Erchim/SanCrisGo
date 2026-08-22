import { describe, expect, it } from "vitest";
import {
  CONTRIBUTION_WHATSAPP_NUMBER,
  buildWhatsAppUrl,
  contributionMessage,
  contributionWhatsAppUrl,
  correctionMessage,
  correctionWhatsAppUrl,
  normalizeWhatsAppNumber,
} from "@/lib/contributions";

describe("moderated WhatsApp contributions", () => {
  it("normalizes the configured Mexican contribution number", () => {
    expect(normalizeWhatsAppNumber("+52 967 192 2636")).toBe("529671922636");
    expect(CONTRIBUTION_WHATSAPP_NUMBER).toBe("529671922636");
    expect(normalizeWhatsAppNumber("123")).toBeNull();
  });

  it("encodes messages without losing punctuation", () => {
    const url = buildWhatsAppUrl("+52 967 192 2636", "Hola, café & música");
    expect(url).toBe("https://wa.me/529671922636?text=Hola%2C%20caf%C3%A9%20%26%20m%C3%BAsica");
  });

  it("provides concise Place and Event templates in both languages", () => {
    expect(contributionMessage("place", "en")).toContain("Place/business");
    expect(contributionMessage("place", "es")).toContain("lugar/negocio");
    expect(contributionMessage("event", "en")).toContain("Event for SanCrisGo");
    expect(contributionMessage("event", "es")).toContain("evento para SanCrisGo");
    expect(contributionWhatsAppUrl("event", "es")).toMatch(/^https:\/\/wa\.me\/529671922636\?text=/);
  });

  it("includes the entity title and canonical URL in correction messages", () => {
    const canonical = "https://www.sancrisgo.com/events/live-music";
    expect(correctionMessage("Live music", canonical, "en")).toContain("Live music — https://");
    expect(correctionMessage("Música en vivo", canonical, "es")).toContain("quizá necesite actualizarse");
    expect(decodeURIComponent(correctionWhatsAppUrl("Live music", canonical, "en")))
      .toContain(canonical);
  });
});
