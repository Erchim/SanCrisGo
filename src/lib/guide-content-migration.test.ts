import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260822140000_guide_translation_families.sql", import.meta.url),
  "utf8",
);

describe("initial Spanish Guide content migration", () => {
  it("creates one language-specific row per existing published Guide", () => {
    expect(migration.match(/insert into public\.guides/g)).toHaveLength(3);
    expect(migration).toContain("guides_translation_group_language_key");
    expect(migration).toContain("translation_group_id = id");
  });

  it("uses Spanish internal Guide counterparts and preserves external URLs", () => {
    expect(migration).toContain("/es/guias/del-aeropuerto-de-tuxtla-gutierrez-a-san-cristobal-de-las-casas");
    expect(migration).toContain("/es/guias/de-san-cristobal-de-las-casas-al-aeropuerto-de-tuxtla-gutierrez");
    expect(migration).not.toMatch(/\]\(\/guides\//);
    expect(migration).toContain("https://www.ado.com.mx/");
  });

  it("retains the source verification date and never overwrites translated edits", () => {
    expect(migration.match(/2026-08-13 00:00:00\+00/g)).toHaveLength(3);
    expect(migration.match(/on conflict \(id\) do nothing/g)).toHaveLength(3);
  });
});
