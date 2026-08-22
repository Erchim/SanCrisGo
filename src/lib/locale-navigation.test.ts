import { describe, expect, it } from "vitest";
import { knownLocalizedPaths, publicNavigationState } from "@/lib/locale-navigation";

describe("route-aware public navigation", () => {
  it.each([
    ["/", "/es"],
    ["/events", "/es/eventos"],
    ["/taxi", "/es/taxi"],
    ["/guides", "/es/guias"],
  ])("maps %s to its Spanish counterpart", (pathname, expected) => {
    expect(knownLocalizedPaths(pathname)?.es).toBe(expected);
  });

  it.each([
    ["/es", "/es", "/es/eventos", "/es/taxi", "/es/guias"],
    ["/es/eventos", "/es", "/es/eventos", "/es/taxi", "/es/guias"],
    ["/es/taxi", "/es", "/es/eventos", "/es/taxi", "/es/guias"],
    ["/es/guias", "/es", "/es/eventos", "/es/taxi", "/es/guias"],
  ])("keeps navigation inside Spanish from %s", (pathname, home, events, taxi, guides) => {
    expect(publicNavigationState(pathname)).toMatchObject({
      locale: "es",
      homeHref: home,
      eventsHref: events,
      taxiHref: taxi,
      guidesHref: guides,
    });
  });

  it("updates navigation from the current pathname rather than stale layout state", () => {
    expect(publicNavigationState("/events").locale).toBe("en");
    expect(publicNavigationState("/es/eventos")).toMatchObject({
      locale: "es",
      homeHref: "/es",
      taxiHref: "/es/taxi",
    });
  });

  it("supports event detail pairs while requiring validation from English", () => {
    expect(knownLocalizedPaths("/events/weekly-music")).toBeUndefined();
    expect(knownLocalizedPaths("/es/eventos/weekly-music")).toEqual({
      en: "/events/weekly-music",
      es: "/es/eventos/weekly-music",
    });
  });

  it("does not claim a Spanish counterpart for English-only routes", () => {
    expect(knownLocalizedPaths("/guides/getting-around")).toBeUndefined();
    expect(knownLocalizedPaths("/places/city-museum")).toBeNull();
  });
});
