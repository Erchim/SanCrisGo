import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  EventAiPrefillError,
  generateEventAiPrefill,
  type EventAiAttempt,
} from "./event-ai-prefill";
import type { EventAiPrefill } from "./event-ai-schema";

function prefill(overrides: Partial<EventAiPrefill> = {}): EventAiPrefill {
  return {
    title: "Concert",
    title_es: "Concierto",
    event_type: "music",
    summary: null,
    summary_es: null,
    description: null,
    description_es: null,
    venue_name: null,
    address: null,
    starts_on: "2026-08-20",
    starts_time: "19:00",
    ends_on: null,
    ends_time: null,
    price_text: null,
    price_text_es: null,
    contact_phone: null,
    ticket_url: null,
    organizer_name: null,
    organizer_url: null,
    source_url: null,
    source_language: "es",
    warnings: [],
    ...overrides,
  };
}

afterEach(() => {
  delete process.env.AI_EVENT_MODEL;
});

describe("event AI generation", () => {
  it("uses the cheapest default model and stops after a complete first image", async () => {
    const attempt = vi.fn<EventAiAttempt>().mockResolvedValue({
      output: prefill(),
      usage: { inputTokens: 1_000, outputTokens: 200 },
    });

    const generated = await generateEventAiPrefill({
      caption: "Música en vivo",
      receivedAt: "2026-08-19T01:00:00.000Z",
      imageUrls: ["https://example.com/one.jpg", "https://example.com/two.jpg"],
    }, attempt);

    expect(attempt).toHaveBeenCalledTimes(1);
    expect(attempt).toHaveBeenCalledWith(expect.objectContaining({
      model: "openai/gpt-5-nano",
      sourceDate: "2026-08-18",
      imageUrl: "https://example.com/one.jpg",
    }));
    expect(generated.result.title).toBe("Concert");
    expect(generated.estimatedCostUsd).toBe(0.00013);
  });

  it("uses a second image only to recover a missing title or date", async () => {
    const attempt = vi.fn<EventAiAttempt>()
      .mockResolvedValueOnce({
        output: prefill({ title: null, starts_on: null, venue_name: "Keep me" }),
        usage: { inputTokens: 100, outputTokens: 20 },
      })
      .mockResolvedValueOnce({
        output: prefill({ title: "Recovered", venue_name: "Do not replace" }),
        usage: { inputTokens: 120, outputTokens: 25 },
      });

    const generated = await generateEventAiPrefill({
      caption: "",
      receivedAt: "2026-08-19T15:00:00.000Z",
      imageUrls: ["https://example.com/one.jpg", "https://example.com/two.jpg", "https://example.com/three.jpg"],
    }, attempt);

    expect(attempt).toHaveBeenCalledTimes(2);
    expect(generated.result.title).toBe("Recovered");
    expect(generated.result.venue_name).toBe("Keep me");
    expect(generated.inputTokens).toBe(220);
    expect(generated.outputTokens).toBe(45);
  });

  it("refuses an empty candidate without spending a model request", async () => {
    const attempt = vi.fn<EventAiAttempt>();
    await expect(generateEventAiPrefill({
      caption: "  ",
      receivedAt: "2026-08-19T15:00:00.000Z",
      imageUrls: [],
    }, attempt)).rejects.toBeInstanceOf(EventAiPrefillError);
    expect(attempt).not.toHaveBeenCalled();
  });
});
