import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/site-url", () => ({
  getAbsoluteUrl: (path: string) => `https://www.sancrisgo.com${path}`,
}));

import { metadata as englishMetadata } from "@/app/contribute/page";
import { metadata as spanishMetadata } from "@/app/es/participa/page";

describe("contribution page metadata", () => {
  it("uses reciprocal localized canonicals", () => {
    expect(englishMetadata.alternates).toMatchObject({
      canonical: "https://www.sancrisgo.com/contribute",
      languages: {
        en: "https://www.sancrisgo.com/contribute",
        es: "https://www.sancrisgo.com/es/participa",
      },
    });
    expect(spanishMetadata.alternates).toMatchObject({
      canonical: "https://www.sancrisgo.com/es/participa",
      languages: {
        en: "https://www.sancrisgo.com/contribute",
        es: "https://www.sancrisgo.com/es/participa",
      },
    });
  });
});
