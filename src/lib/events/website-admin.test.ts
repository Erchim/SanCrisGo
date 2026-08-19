import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  EventWebsiteAdminError,
  parseEventDraftForm,
  websiteQueueState,
} from "./website-admin";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  Object.entries(values).forEach(([name, value]) => data.set(name, value));
  return data;
}

describe("website event admin", () => {
  const candidateId = "103e4cf0-0a68-4df8-a3f5-f9d982832421";

  it("allows a required date without inventing a time", () => {
    const draft = parseEventDraftForm(form({
      title: "Concierto en el centro",
      starts_on: "2026-08-20",
      event_type: "live_music",
    }), candidateId);

    expect(draft.startsOn).toBe("2026-08-20");
    expect(draft.startsAt).toBeNull();
    expect(draft.slug).toBe("concierto-en-el-centro-2026-08-20-103e4c");
  });

  it("converts an optional local time to a timezone-safe timestamp", () => {
    const draft = parseEventDraftForm(form({
      title: "Evening event",
      starts_on: "2026-08-18",
      starts_time: "18:30",
      ends_time: "20:00",
    }), candidateId);

    expect(draft.startsAt).toBe("2026-08-19T00:30:00.000Z");
    expect(draft.endsOn).toBe("2026-08-18");
    expect(draft.endsAt).toBe("2026-08-19T02:00:00.000Z");
  });

  it("rejects an end time when the start time is unknown", () => {
    expect(() => parseEventDraftForm(form({
      title: "Incomplete event",
      starts_on: "2026-08-20",
      ends_time: "20:00",
    }), candidateId)).toThrow(EventWebsiteAdminError);
  });

  it("keeps website review state independent from candidate status", () => {
    expect(websiteQueueState(null, false)).toBe("unreviewed");
    expect(websiteQueueState({ status: "pending" }, false)).toBe("draft");
    expect(websiteQueueState({ status: "published" }, true)).toBe("published");
    expect(websiteQueueState(null, true)).toBe("skipped");
  });
});
