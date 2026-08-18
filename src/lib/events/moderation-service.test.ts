import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { EventModerationService } from "./moderation-service";
import type { EventModerationRepository, ModerationCandidate } from "./moderation-repository";

function harness(status: string, options: { approveCas?: boolean; rejectCas?: boolean; afterCas?: string; publishError?: Error } = {}) {
  const candidate: ModerationCandidate = { id: "candidate-1", status };
  const repository: EventModerationRepository = {
    getCandidate: vi.fn().mockResolvedValueOnce(candidate).mockResolvedValue({ ...candidate, status: options.afterCas ?? status }),
    approvePending: vi.fn().mockResolvedValue(options.approveCas ?? true),
    rejectPending: vi.fn().mockResolvedValue(options.rejectCas ?? true),
  };
  const publishCandidate = options.publishError ? vi.fn().mockRejectedValue(options.publishError) : vi.fn().mockResolvedValue({ publicationId: "p1", instagramMediaId: "ig1", alreadyPublished: false });
  return { service: new EventModerationService({ repository, publishCandidate }), repository, publishCandidate };
}

describe("EventModerationService", () => {
  it("transitions pending to approved and publishes to Instagram", async () => {
    const h = harness("pending");
    await h.service.approve("candidate-1");
    expect(h.repository.approvePending).toHaveBeenCalledWith("candidate-1");
    expect(h.publishCandidate).toHaveBeenCalledOnce();
  });
  it("rejects pending without publishing", async () => {
    const h = harness("pending");
    await expect(h.service.reject("candidate-1")).resolves.toEqual({ alreadyRejected: false });
    expect(h.publishCandidate).not.toHaveBeenCalled();
  });
  it("repeated approval relies on publication idempotency", async () => {
    const h = harness("approved");
    await h.service.approve("candidate-1");
    expect(h.repository.approvePending).not.toHaveBeenCalled();
    expect(h.publishCandidate).toHaveBeenCalledOnce();
  });
  it("makes repeated rejection idempotent", async () => {
    const h = harness("rejected");
    await expect(h.service.reject("candidate-1")).resolves.toEqual({ alreadyRejected: true });
    expect(h.repository.rejectPending).not.toHaveBeenCalled();
  });
  it("does not publish a rejected candidate", async () => {
    const h = harness("rejected");
    await expect(h.service.approve("candidate-1")).rejects.toThrow("cannot be published");
    expect(h.publishCandidate).not.toHaveBeenCalled();
  });
  it("does not reject an approved candidate", async () => {
    const h = harness("approved");
    await expect(h.service.reject("candidate-1")).rejects.toThrow("cannot be rejected");
  });
  it("leaves approved candidates retryable after an Instagram failure", async () => {
    const first = harness("pending", { publishError: new Error("failed") });
    await expect(first.service.approve("candidate-1")).rejects.toThrow("failed");
    const retry = harness("approved");
    await expect(retry.service.approve("candidate-1")).resolves.toBeDefined();
    expect(retry.publishCandidate).toHaveBeenCalledOnce();
  });
  it("resolves concurrent CAS approval safely", async () => {
    const h = harness("pending", { approveCas: false, afterCas: "approved" });
    await expect(h.service.approve("candidate-1")).resolves.toBeDefined();
    expect(h.publishCandidate).toHaveBeenCalledOnce();
  });
});
