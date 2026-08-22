import { describe, expect, it } from "vitest";
import {
  formatEventCardDate,
  formatEventDate,
  formatEventTimeRange,
  formatEventType,
  safeExternalUrl,
  safePhoneHref,
} from "./presentation";

describe("event presentation", () => {
  it("formats event dates in the San Cristobal time zone", () => {
    expect(formatEventDate("2026-08-19T00:30:00.000Z")).toBe("Tuesday, August 18, 2026");
    expect(formatEventTimeRange("2026-08-19T00:30:00.000Z", "2026-08-19T02:00:00.000Z"))
      .toBe("6:30 PM–8:00 PM");
    expect(formatEventDate("2026-08-18")).toBe("Tuesday, August 18, 2026");
    expect(formatEventCardDate("2026-08-18")).toBe("AUG 18");
    expect(formatEventTimeRange(null, null)).toBe("Time to be confirmed");
  });

  it("turns stored event types into labels", () => {
    expect(formatEventType("live_music")).toBe("Live Music");
    expect(formatEventType("music", "es")).toBe("Música");
  });

  it("formats Spanish dates and missing times with Spanish semantics", () => {
    expect(formatEventDate("2026-08-18", false, "es")).toBe("martes, 18 de agosto de 2026");
    expect(formatEventTimeRange(null, null, "es")).toBe("Hora por confirmar");
  });

  it("allows only HTTP links from event data", () => {
    expect(safeExternalUrl("https://example.com/tickets")).toBe("https://example.com/tickets");
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("not a URL")).toBeNull();
  });

  it("creates safe telephone links without changing the displayed value", () => {
    expect(safePhoneHref("+52 (967) 123-4567")).toBe("tel:+529671234567");
    expect(safePhoneHref("call us")).toBeNull();
  });
});
