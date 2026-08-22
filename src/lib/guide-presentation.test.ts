import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/site-url", () => ({
  getAbsoluteUrl: (path: string) => `https://www.sancrisgo.com${path}`,
}));

import { buildGuideMetadata, guideBreadcrumbJsonLd } from "@/lib/guide-presentation";

const pageData = {
  guide: {
    id: "es-guide",
    translation_group_id: "family",
    title: "Guía del aeropuerto",
    slug: "guia-aeropuerto",
    summary: "Resumen",
    category: "Transporte",
    language: "es" as const,
    published_at: "2026-08-22T00:00:00Z",
    updated_at: "2026-08-22T00:00:00Z",
    last_verified_at: "2026-08-13T00:00:00Z",
    body_markdown: "Contenido",
    seo_title: "Guía del aeropuerto",
    seo_description: "Descripción en español",
  },
  localizedPaths: {
    en: "/guides/airport-guide",
    es: "/es/guias/guia-aeropuerto",
  },
};

describe("Guide SEO presentation", () => {
  it("uses a Spanish canonical and reciprocal hreflang", () => {
    const metadata = buildGuideMetadata(pageData, "es");
    expect(metadata.alternates).toEqual({
      canonical: "https://www.sancrisgo.com/es/guias/guia-aeropuerto",
      languages: {
        en: "https://www.sancrisgo.com/guides/airport-guide",
        es: "https://www.sancrisgo.com/es/guias/guia-aeropuerto",
        "x-default": "https://www.sancrisgo.com/guides/airport-guide",
      },
    });
    expect(metadata.openGraph).toMatchObject({ locale: "es_MX" });
  });

  it("localizes the breadcrumb names and URLs", () => {
    expect(guideBreadcrumbJsonLd(pageData, "es")?.itemListElement[1]).toMatchObject({
      name: "Guías",
      item: "https://www.sancrisgo.com/es/guias",
    });
  });
});
