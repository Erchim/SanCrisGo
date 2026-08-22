import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { EventAiPrefill } from "./event-ai-schema";
import type { GeneratedEventAiPrefill } from "./event-ai-prefill";
import {
  runEventAiPrefillWorkflow,
  type EventAiPrefillWorkflowDependencies,
} from "./event-ai-prefill-workflow";

const generated: GeneratedEventAiPrefill = {
  result: {
    title: "Live music",
    title_es: "Música en vivo",
    starts_on: "2026-08-22",
    starts_time: "19:00",
    ends_on: null,
    ends_time: null,
    recurrence_frequency: null,
    recurrence_until: null,
    event_type: "music",
    venue_name: "Foro Cultural",
    address: null,
    price_text: null,
    price_text_es: null,
    contact_phone: null,
    summary: null,
    summary_es: null,
    description: null,
    description_es: null,
    source_url: null,
    ticket_url: null,
    organizer_name: null,
    organizer_url: null,
    source_language: "es",
    warnings: [],
  } satisfies EventAiPrefill,
  model: "openai/gpt-5-nano",
  inputTokens: 120,
  outputTokens: 80,
  estimatedCostUsd: 0.000038,
};

function dependencies(status: "ready" | "failed" | null = null) {
  const store = {
    getCandidateDetail: vi.fn().mockResolvedValue({
      candidate: {
        id: "candidate-1",
        status: "pending",
        original_text: "Sábado, música en vivo",
        media_path: "event.jpg",
        source_group_name: "Events",
        source_sender_name: "Sender",
        created_at: "2026-08-20T12:00:00.000Z",
      },
      media: [{ path: "event.jpg", sequence: 0, signedUrl: "https://example.com/event.jpg" }],
      publication: null,
      event: null,
      aiPrefill: status ? {
        status,
        model: "openai/gpt-5-nano",
        result: status === "ready" ? generated.result : null,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: null,
        errorClass: status === "failed" ? "PreviousError" : null,
        analyzedAt: "2026-08-20T12:01:00.000Z",
      } : null,
      state: "unreviewed",
    }),
    saveAiPrefill: vi.fn().mockResolvedValue(undefined),
    saveAiPrefillFailure: vi.fn().mockResolvedValue(undefined),
  };
  const deps: EventAiPrefillWorkflowDependencies = {
    store,
    generate: vi.fn().mockResolvedValue(generated),
    getModel: vi.fn().mockReturnValue("openai/gpt-5-nano"),
  };
  return { deps, store };
}

describe("event AI prefill workflow", () => {
  it("generates and persists suggestions for a new candidate", async () => {
    const { deps, store } = dependencies();

    await expect(runEventAiPrefillWorkflow("candidate-1", {}, deps)).resolves.toBe("generated");

    expect(deps.generate).toHaveBeenCalledWith({
      caption: "Sábado, música en vivo",
      receivedAt: "2026-08-20T12:00:00.000Z",
      imageUrls: ["https://example.com/event.jpg"],
    });
    expect(store.saveAiPrefill).toHaveBeenCalledWith("candidate-1", generated);
  });

  it("does not spend another AI call when background work sees a ready result", async () => {
    const { deps, store } = dependencies("ready");

    await expect(runEventAiPrefillWorkflow("candidate-1", {}, deps)).resolves.toBe("already-ready");

    expect(deps.generate).not.toHaveBeenCalled();
    expect(store.saveAiPrefill).not.toHaveBeenCalled();
  });

  it("keeps manual re-analysis available for an existing ready result", async () => {
    const { deps, store } = dependencies("ready");

    await expect(runEventAiPrefillWorkflow("candidate-1", { force: true }, deps)).resolves.toBe("generated");

    expect(deps.generate).toHaveBeenCalledOnce();
    expect(store.saveAiPrefill).toHaveBeenCalledOnce();
  });

  it("records a safe failure class without replacing the original error", async () => {
    const { deps, store } = dependencies();
    const failure = new TypeError("sensitive provider details");
    vi.mocked(deps.generate).mockRejectedValue(failure);

    await expect(runEventAiPrefillWorkflow("candidate-1", {}, deps)).rejects.toBe(failure);

    expect(store.saveAiPrefillFailure).toHaveBeenCalledWith(
      "candidate-1",
      "openai/gpt-5-nano",
      "TypeError",
    );
  });
});
