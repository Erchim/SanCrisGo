import { describe, expect, it } from "vitest";
import { localEventDateTimeToISOString, resolveEventDateSelection } from "./date-filter";

describe("resolveEventDateSelection", () => {
  const tuesdayEveningInChiapas = new Date("2026-08-19T00:30:00.000Z");

  it("uses all upcoming events as the default selection", () => {
    expect(resolveEventDateSelection(undefined, undefined, tuesdayEveningInChiapas)).toEqual({
      filter: "upcoming",
      label: "All upcoming events",
      start: "2026-08-19T00:30:00.000Z",
    });
  });

  it("uses the San Cristobal calendar day when today is selected", () => {
    expect(resolveEventDateSelection("today", undefined, tuesdayEveningInChiapas)).toEqual({
      filter: "today",
      label: "Today",
      start: "2026-08-18T06:00:00.000Z",
      end: "2026-08-19T06:00:00.000Z",
    });
  });

  it("builds tomorrow and upcoming selections", () => {
    expect(resolveEventDateSelection("tomorrow", undefined, tuesdayEveningInChiapas)).toMatchObject({
      filter: "tomorrow",
      start: "2026-08-19T06:00:00.000Z",
      end: "2026-08-20T06:00:00.000Z",
    });
    expect(resolveEventDateSelection("upcoming", undefined, tuesdayEveningInChiapas)).toEqual({
      filter: "upcoming",
      label: "All upcoming events",
      start: "2026-08-19T00:30:00.000Z",
    });
  });

  it("uses the next Saturday and Sunday for this weekend", () => {
    expect(resolveEventDateSelection("weekend", undefined, tuesdayEveningInChiapas)).toEqual({
      filter: "weekend",
      label: "This weekend",
      start: "2026-08-22T06:00:00.000Z",
      end: "2026-08-24T06:00:00.000Z",
    });
  });

  it("keeps only the remaining Sunday when requested on Sunday", () => {
    const sundayMorning = new Date("2026-08-23T15:00:00.000Z");
    expect(resolveEventDateSelection("weekend", undefined, sundayMorning)).toEqual({
      filter: "weekend",
      label: "This weekend",
      start: "2026-08-23T06:00:00.000Z",
      end: "2026-08-24T06:00:00.000Z",
    });
  });

  it("accepts valid custom dates and ignores invalid ones", () => {
    expect(resolveEventDateSelection(undefined, "2026-08-31", tuesdayEveningInChiapas)).toEqual({
      filter: "date",
      label: "Monday, August 31",
      start: "2026-08-31T06:00:00.000Z",
      end: "2026-09-01T06:00:00.000Z",
      dateInput: "2026-08-31",
    });
    expect(resolveEventDateSelection(undefined, "2026-02-30", tuesdayEveningInChiapas).filter).toBe("upcoming");
  });

  it("converts optional event form time in the San Cristobal time zone", () => {
    expect(localEventDateTimeToISOString("2026-08-18", "18:30"))
      .toBe("2026-08-19T00:30:00.000Z");
    expect(localEventDateTimeToISOString("2026-02-30", "18:30")).toBeNull();
    expect(localEventDateTimeToISOString("2026-08-18", "25:00")).toBeNull();
  });
});
