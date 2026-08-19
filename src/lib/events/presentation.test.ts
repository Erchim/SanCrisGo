import { describe, expect, it } from "vitest";
import {
  formatEventDate,
  formatEventTimeRange,
  formatEventType,
  safeExternalUrl,
} from "./presentation";

describe("event presentation", () => {
  it("formats event dates in the San Cristobal time zone", () => {
    expect(formatEventDate("2026-08-19T00:30:00.000Z")).toBe("Tuesday, August 18, 2026");
    expect(formatEventTimeRange("2026-08-19T00:30:00.000Z", "2026-08-19T02:00:00.000Z"))
      .toBe("6:30 PM–8:00 PM");
  });

  it("turns stored event types into labels", () => {
    expect(formatEventType("live_music")).toBe("Live Music");
  });

  it("allows only HTTP links from event data", () => {
    expect(safeExternalUrl("https://example.com/tickets")).toBe("https://example.com/tickets");
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("not a URL")).toBeNull();
  });
});
