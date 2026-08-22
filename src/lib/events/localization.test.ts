import { describe, expect, it } from "vitest";
import { hasUsableSpanishEvent, localizeEventText } from "./localization";

const event = {
  source_language: "en",
  title: "Live music",
  title_es: "Música en vivo",
  summary: "An evening concert.",
  summary_es: "Un concierto por la noche.",
  description: "Full English description.",
  description_es: "Descripción completa en español.",
  price_text: "Free",
  price_text_es: "Entrada libre",
};

describe("event localization", () => {
  it("prefers structured Spanish fields", () => {
    expect(localizeEventText(event, "es")).toEqual({
      title: "Música en vivo",
      summary: "Un concierto por la noche.",
      description: "Descripción completa en español.",
      price_text: "Entrada libre",
    });
  });

  it("uses base fields as safe fallback for Spanish source material", () => {
    expect(localizeEventText({
      ...event,
      source_language: "es-MX",
      title: "Mercado artesanal",
      title_es: null,
      summary: "Productos locales.",
      summary_es: null,
      description: "Artesanías de la región.",
      description_es: null,
      price_text: "Entrada libre",
      price_text_es: null,
    }, "es")).toEqual({
      title: "Mercado artesanal",
      summary: "Productos locales.",
      description: "Artesanías de la región.",
      price_text: "Entrada libre",
    });
  });

  it("does not expose untranslated non-Spanish content as Spanish", () => {
    const untranslated = {
      ...event,
      title_es: null,
      summary_es: null,
      description_es: null,
      price_text_es: null,
    };

    expect(localizeEventText(untranslated, "es")).toBeNull();
    expect(hasUsableSpanishEvent(untranslated)).toBe(false);
  });

  it("keeps English presentation unchanged", () => {
    expect(localizeEventText(event, "en")).toEqual({
      title: "Live music",
      summary: "An evening concert.",
      description: "Full English description.",
      price_text: "Free",
    });
  });
});
