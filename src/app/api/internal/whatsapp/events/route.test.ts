import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { createWhatsAppEventsHandler } from "./route";

const endpoint = "http://localhost/api/internal/whatsapp/events";

function formRequest(overrides: { image?: File | null; caption?: string; messageId?: string } = {}, authorized = true) {
  const form = new FormData();
  const image = overrides.image === undefined ? new File(["image"], "event.jpg", { type: "image/jpeg" }) : overrides.image;
  if (image) form.set("image", image);
  form.set("sourceGroupId", "group-1");
  form.set("sourceGroupName", "Events group");
  form.set("sourceSenderId", "sender-1");
  form.set("sourceSenderName", "Sender");
  form.set("sourceMessageId", overrides.messageId ?? "message-1");
  form.set("caption", overrides.caption ?? "Event caption");
  form.set("receivedAt", "2026-08-19T12:00:00.000Z");
  return new Request(endpoint, {
    method: "POST",
    headers: authorized ? { authorization: "Bearer whatsapp-secret" } : undefined,
    body: form,
  });
}

function dependencies(result: { candidateId: string; created?: boolean } = { candidateId: "candidate-1" }) {
  let claimed = false;
  let sent = false;
  let ingested = false;
  return {
    ingester: {
      ingest: vi.fn(async () => {
        const created = result.created ?? !ingested;
        ingested = true;
        return { candidateId: result.candidateId, created };
      }),
      claimModerationDispatch: vi.fn(async () => {
        if (claimed || sent) return false;
        claimed = true;
        return true;
      }),
      markModerationSent: vi.fn(async () => { sent = true; claimed = false; }),
      releaseModerationDispatch: vi.fn(async () => { claimed = false; }),
    },
    dispatch: vi.fn().mockResolvedValue(undefined),
    schedulePrefill: vi.fn(),
  };
}

function handlerFor(deps: ReturnType<typeof dependencies>) {
  return createWhatsAppEventsHandler(deps.ingester, deps.dispatch, deps.schedulePrefill);
}

describe("WhatsApp event ingestion endpoint", () => {
  beforeEach(() => { process.env.WHATSAPP_INGEST_SECRET = "whatsapp-secret"; });

  it("rejects an unauthorized request", async () => {
    const deps = dependencies();
    const response = await handlerFor(deps)(formRequest({}, false));
    expect(response.status).toBe(401);
    expect(deps.ingester.ingest).not.toHaveBeenCalled();
  });

  it("rejects invalid multipart data and a missing image", async () => {
    const deps = dependencies();
    const handler = handlerFor(deps);
    const malformed = await handler(new Request(endpoint, { method: "POST", headers: { authorization: "Bearer whatsapp-secret", "content-type": "application/json" }, body: "{}" }));
    const missing = await handler(formRequest({ image: null }));
    expect(malformed.status).toBe(400);
    expect(missing.status).toBe(400);
  });

  it("rejects unsupported image MIME types", async () => {
    const deps = dependencies();
    const response = await handlerFor(deps)(
      formRequest({ image: new File(["gif"], "event.gif", { type: "image/gif" }) }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects image payloads larger than 4 MiB", async () => {
    const deps = dependencies();
    const image = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" });
    const response = await handlerFor(deps)(formRequest({ image }));
    expect(response.status).toBe(413);
  });

  it("persists and dispatches a valid image and caption", async () => {
    const deps = dependencies();
    const response = await handlerFor(deps)(formRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, candidateId: "candidate-1" });
    expect(deps.ingester.ingest).toHaveBeenCalledWith(expect.objectContaining({
      caption: "Event caption",
      images: [expect.objectContaining({ sourceMessageId: "message-1", extension: "jpg" })],
    }));
    expect(deps.dispatch).toHaveBeenCalledOnce();
    expect(deps.ingester.markModerationSent).toHaveBeenCalledWith("candidate-1");
    expect(deps.schedulePrefill).toHaveBeenCalledWith("candidate-1");
  });

  it("keeps ingestion and Telegram independent when AI scheduling fails", async () => {
    const deps = dependencies();
    deps.schedulePrefill.mockImplementation(() => { throw new Error("scheduler unavailable"); });
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await handlerFor(deps)(formRequest());

    expect(response.status).toBe(200);
    expect(deps.dispatch).toHaveBeenCalledWith("candidate-1");
    expect(log).toHaveBeenCalledWith("[whatsapp-ingest] ai_prefill_schedule_failed");
    log.mockRestore();
  });

  it("persists and dispatches an image without a caption", async () => {
    const deps = dependencies();
    const response = await handlerFor(deps)(
      formRequest({ caption: "" }),
    );

    expect(response.status).toBe(200);
    expect(deps.ingester.ingest).toHaveBeenCalledWith(expect.objectContaining({
      caption: "",
      images: [expect.objectContaining({ sourceMessageId: "message-1", extension: "jpg" })],
    }));
    expect(deps.dispatch).toHaveBeenCalledWith("candidate-1");
  });

  it("accepts ordered image, message ID, and timestamp fields for an album", async () => {
    const deps = dependencies();
    const form = new FormData();
    form.append("image", new File(["one"], "one.jpg", { type: "image/jpeg" }));
    form.append("image", new File(["two"], "two.png", { type: "image/png" }));
    form.append("sourceMessageId", "message-1");
    form.append("sourceMessageId", "message-2");
    form.append("receivedAt", "2026-08-19T12:00:00.000Z");
    form.append("receivedAt", "2026-08-19T12:00:05.000Z");
    form.set("sourceGroupId", "group-1");
    form.set("caption", "Album caption");
    const request = new Request(endpoint, {
      method: "POST",
      headers: { authorization: "Bearer whatsapp-secret" },
      body: form,
    });

    const response = await handlerFor(deps)(request);

    expect(response.status).toBe(200);
    expect(deps.ingester.ingest).toHaveBeenCalledWith(expect.objectContaining({
      caption: "Album caption",
      images: [
        expect.objectContaining({ sourceMessageId: "message-1", extension: "jpg" }),
        expect.objectContaining({ sourceMessageId: "message-2", extension: "png" }),
      ],
    }));
  });

  it("rejects an album when per-image metadata counts do not match", async () => {
    const deps = dependencies();
    const form = new FormData();
    form.append("image", new File(["one"], "one.jpg", { type: "image/jpeg" }));
    form.append("image", new File(["two"], "two.jpg", { type: "image/jpeg" }));
    form.append("sourceMessageId", "message-1");
    form.append("receivedAt", "2026-08-19T12:00:00.000Z");
    form.append("receivedAt", "2026-08-19T12:00:05.000Z");
    form.set("sourceGroupId", "group-1");
    const request = new Request(endpoint, {
      method: "POST",
      headers: { authorization: "Bearer whatsapp-secret" },
      body: form,
    });

    const response = await handlerFor(deps)(request);

    expect(response.status).toBe(400);
    expect(deps.ingester.ingest).not.toHaveBeenCalled();
  });

  it("treats a previously moderated duplicate sourceMessageId as idempotent", async () => {
    const deps = dependencies({ candidateId: "existing-candidate" });
    const handler = handlerFor(deps);
    const first = await handler(formRequest({ messageId: "duplicate" }));
    const retry = await handler(formRequest({ messageId: "duplicate" }));
    expect(first.status).toBe(200);
    expect(retry.status).toBe(200);
    expect(deps.dispatch).toHaveBeenCalledOnce();
    expect(deps.schedulePrefill).toHaveBeenCalledOnce();
  });

  it("dispatches Telegram only once across two concurrent requests", async () => {
    const deps = dependencies();
    const handler = handlerFor(deps);
    const [first, second] = await Promise.all([handler(formRequest()), handler(formRequest())]);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(deps.dispatch).toHaveBeenCalledOnce();
    expect(deps.schedulePrefill).toHaveBeenCalledOnce();
  });

  it("does not dispatch again on a normal sequential retry after sent state", async () => {
    const deps = dependencies();
    const handler = handlerFor(deps);
    await handler(formRequest());
    await handler(formRequest());
    expect(deps.dispatch).toHaveBeenCalledOnce();
    expect(deps.ingester.claimModerationDispatch).toHaveBeenCalledTimes(2);
    expect(deps.schedulePrefill).toHaveBeenCalledOnce();
  });

  it("keeps a persisted candidate retryable when Telegram fails", async () => {
    const deps = dependencies();
    deps.dispatch.mockRejectedValueOnce(new Error("Telegram details")).mockResolvedValueOnce(undefined);
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const handler = handlerFor(deps);
    const response = await handler(formRequest());
    const retry = await handler(formRequest());
    expect(response.status).toBe(502);
    expect(retry.status).toBe(200);
    expect(deps.ingester.markModerationSent).toHaveBeenCalledOnce();
    expect(deps.ingester.releaseModerationDispatch).toHaveBeenCalledWith("candidate-1");
    expect(deps.dispatch).toHaveBeenCalledTimes(2);
    await expect(response.json()).resolves.toEqual({ error: "Moderation dispatch failed." });
    expect(log).toHaveBeenCalledWith("[whatsapp-ingest] moderation_dispatch_failed");
    log.mockRestore();
  });

  it("leaves the claim in place when Telegram succeeds but finalizing fails", async () => {
    const deps = dependencies();
    deps.ingester.markModerationSent.mockRejectedValue(new Error("database unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const handler = handlerFor(deps);
    const first = await handler(formRequest());
    const retry = await handler(formRequest());
    expect(first.status).toBe(502);
    expect(retry.status).toBe(200);
    expect(deps.dispatch).toHaveBeenCalledOnce();
    expect(deps.ingester.releaseModerationDispatch).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith("[whatsapp-ingest] moderation_finalize_failed");
    log.mockRestore();
  });
});
