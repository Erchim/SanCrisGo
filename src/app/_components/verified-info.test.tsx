import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VerifiedInfo } from "@/app/_components/verified-info";

describe("verified information presentation", () => {
  it("shows only a genuine supplied verification date in English", () => {
    const html = renderToStaticMarkup(
      <VerifiedInfo lastVerifiedAt="2026-08-21T00:00:00Z" locale="en" />,
    );
    expect(html).toContain("Last verified");
    expect(html).toContain("August 2026");
  });

  it("formats the same verified fact naturally in Spanish", () => {
    const html = renderToStaticMarkup(
      <VerifiedInfo lastVerifiedAt="2026-08-21T00:00:00Z" locale="es" />,
    );
    expect(html).toContain("Última verificación");
    expect(html).toContain("agosto de 2026");
  });
});
