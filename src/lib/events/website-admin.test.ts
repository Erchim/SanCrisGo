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
    expect(draft.recurrenceFrequency).toBe("none");
    expect(draft.recurrenceUntil).toBeNull();
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

  it("keeps bilingual copy and a contact phone in the draft", () => {
    const draft = parseEventDraftForm(form({
      title: "Live music",
      title_es: "Música en vivo",
      starts_on: "2026-08-20",
      summary: "An evening concert.",
      summary_es: "Un concierto por la noche.",
      description_es: "Descripción completa.",
      price_text_es: "Entrada libre",
      contact_phone: "+52 967 123 4567",
    }), candidateId);

    expect(draft.titleEs).toBe("Música en vivo");
    expect(draft.summaryEs).toBe("Un concierto por la noche.");
    expect(draft.descriptionEs).toBe("Descripción completa.");
    expect(draft.priceTextEs).toBe("Entrada libre");
    expect(draft.contactPhone).toBe("+52 967 123 4567");
  });

  it("rejects an end time when the start time is unknown", () => {
    expect(() => parseEventDraftForm(form({
      title: "Incomplete event",
      starts_on: "2026-08-20",
      ends_time: "20:00",
    }), candidateId)).toThrow(EventWebsiteAdminError);
  });

  it("accepts a bounded weekly schedule", () => {
    const draft = parseEventDraftForm(form({
      title: "Tuesday class",
      starts_on: "2026-08-04",
      repeats_weekly: "weekly",
      recurrence_until: "2026-10-27",
    }), candidateId);

    expect(draft.recurrenceFrequency).toBe("weekly");
    expect(draft.recurrenceUntil).toBe("2026-10-27");
  });

  it("rejects invalid recurrence state", () => {
    expect(() => parseEventDraftForm(form({
      title: "Invalid series",
      starts_on: "2026-08-20",
      recurrence_until: "2026-08-19",
    }), candidateId)).toThrow(EventWebsiteAdminError);
  });

  it("keeps website review state independent from candidate status", () => {
    expect(websiteQueueState(null, false)).toBe("unreviewed");
    expect(websiteQueueState({ status: "pending" }, false)).toBe("draft");
    expect(websiteQueueState({ status: "published" }, true)).toBe("published");
    expect(websiteQueueState(null, true)).toBe("skipped");
  });
});
