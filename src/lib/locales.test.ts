import { describe, expect, it } from "vitest";
import {
  eventLocalizedPaths,
  eventSitemapPaths,
  eventSlugFromPathname,
  guideLocalizedPaths,
  guideSlugFromPathname,
  localeFromPathname,
  staticLocalizedPaths,
} from "./locales";

describe("public locale routes", () => {
  it("recognizes only the Spanish path tree as Spanish", () => {
    expect(localeFromPathname("/es/eventos")).toBe("es");
    expect(localeFromPathname("/events")).toBe("en");
    expect(localeFromPathname("/especially")).toBe("en");
  });

  it("generates stable localized route pairs", () => {
    expect(staticLocalizedPaths("/es/taxi")).toEqual({ en: "/taxi", es: "/es/taxi" });
    expect(eventLocalizedPaths("musica-en-vivo")).toEqual({
      en: "/events/musica-en-vivo",
      es: "/es/eventos/musica-en-vivo",
    });
  });

  it("maps Guide indexes and builds localized detail paths", () => {
    expect(staticLocalizedPaths("/guides")).toEqual({ en: "/guides", es: "/es/guias" });
    expect(staticLocalizedPaths("/es/guias")).toEqual({ en: "/guides", es: "/es/guias" });
    expect(guideLocalizedPaths("airport-guide", "guia-aeropuerto")).toEqual({
      en: "/guides/airport-guide",
      es: "/es/guias/guia-aeropuerto",
    });
  });

  it("adds Spanish Event sitemap paths only for eligible content", () => {
    expect(eventSitemapPaths("music", false)).toEqual(["/events/music"]);
    expect(eventSitemapPaths("musica", true)).toEqual([
      "/events/musica",
      "/es/eventos/musica",
    ]);
  });

  it("keeps one canonical sitemap path per recurring series and language", () => {
    expect(eventSitemapPaths("weekly-language-exchange", true)).toHaveLength(2);
    expect(new Set(eventSitemapPaths("weekly-language-exchange", true)).size).toBe(2);
  });

  it("extracts event slugs only from the matching locale tree", () => {
    expect(eventSlugFromPathname("/es/eventos/musica", "es")).toBe("musica");
    expect(eventSlugFromPathname("/events/music", "en")).toBe("music");
    expect(eventSlugFromPathname("/events/music/extra", "en")).toBeNull();
  });

  it("extracts localized Guide slugs without guessing a counterpart", () => {
    expect(guideSlugFromPathname("/guides/airport-guide", "en")).toBe("airport-guide");
    expect(guideSlugFromPathname("/es/guias/guia-aeropuerto", "es")).toBe("guia-aeropuerto");
    expect(guideSlugFromPathname("/es/guias/guia/extra", "es")).toBeNull();
  });
});
