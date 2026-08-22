import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteFooterView } from "@/app/_components/site-shell-view";
import { publicNavigationState } from "@/lib/locale-navigation";

describe("localized footer participation links", () => {
  it("links English visitors to Contribute", () => {
    const html = renderToStaticMarkup(
      <SiteFooterView navigation={publicNavigationState("/events")} />,
    );
    expect(html).toContain('href="/contribute"');
    expect(html).toContain("Contribute");
  });

  it("keeps Spanish visitors inside the Spanish participation route", () => {
    const html = renderToStaticMarkup(
      <SiteFooterView navigation={publicNavigationState("/es/eventos")} />,
    );
    expect(html).toContain('href="/es/participa"');
    expect(html).toContain("Participa");
  });
});
