import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { PublicGuidesRepository } from "@/lib/guides";

const english = {
  id: "en-guide",
  translation_group_id: "family-1",
  title: "Airport guide",
  slug: "airport-guide",
  summary: "English summary",
  category: "Transport",
  language: "en",
  published_at: "2026-08-14T00:00:00Z",
  updated_at: "2026-08-14T00:00:00Z",
  last_verified_at: "2026-08-13T00:00:00Z",
  body_markdown: "English body",
  seo_title: "English SEO",
  seo_description: "English description",
  publication_status: "published",
};

const spanish = {
  ...english,
  id: "es-guide",
  title: "Guía del aeropuerto",
  slug: "guia-aeropuerto",
  summary: "Resumen en español",
  category: "Transporte",
  language: "es",
  body_markdown: "Contenido en español",
};

class FakeQuery {
  private filters: Array<[string, unknown]> = [];
  private maximum: number | null = null;

  constructor(private readonly rows: Array<Record<string, unknown>>) {}
  select() { return this; }
  eq(column: string, value: unknown) { this.filters.push([column, value]); return this; }
  in(column: string, values: unknown[]) {
    this.filters.push([column, new Set(values)]);
    return this;
  }
  order() { return this; }
  limit(value: number) { this.maximum = value; return this; }

  private data() {
    const matches = this.rows.filter((row) => this.filters.every(([column, value]) => (
      value instanceof Set ? value.has(row[column]) : row[column] === value
    )));
    return this.maximum === null ? matches : matches.slice(0, this.maximum);
  }

  maybeSingle() {
    return Promise.resolve({ data: this.data()[0] ?? null, error: null });
  }

  then(resolve: (value: { data: unknown[]; error: null }) => unknown) {
    return Promise.resolve({ data: this.data(), error: null }).then(resolve);
  }
}

function repository(rows = [english, spanish]) {
  const client = { from: () => new FakeQuery(rows) };
  return new PublicGuidesRepository(client as never);
}

describe("localized Guides repository", () => {
  it("lists only published Guides in the requested locale", async () => {
    const draft = { ...spanish, id: "draft", slug: "borrador", publication_status: "draft" };
    const guides = await repository([english, spanish, draft]).list("es");
    expect(guides.map((guide) => guide.slug)).toEqual(["guia-aeropuerto"]);
  });

  it("looks up English and Spanish Guides independently", async () => {
    await expect(repository().bySlug("airport-guide", "en")).resolves.toMatchObject({ id: "en-guide" });
    await expect(repository().bySlug("guia-aeropuerto", "es")).resolves.toMatchObject({ id: "es-guide" });
    await expect(repository().bySlug("airport-guide", "es")).resolves.toBeNull();
  });

  it("resolves an explicit published translation pair", async () => {
    await expect(repository().localizedPaths("family-1")).resolves.toEqual({
      en: "/guides/airport-guide",
      es: "/es/guias/guia-aeropuerto",
    });
  });

  it("does not fabricate a counterpart for an untranslated Guide", async () => {
    await expect(repository([english]).localizedPaths("family-1")).resolves.toBeNull();
  });
});
