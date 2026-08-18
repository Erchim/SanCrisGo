import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

import { ModerationSendError } from "@/lib/telegram/moderation";
import { createSendCandidateForModerationHandler } from "./route";

function request() {
  return new Request("http://localhost/api/internal/event-moderation/send", {
    method: "POST",
    headers: { authorization: "Bearer internal-secret", "content-type": "application/json" },
    body: JSON.stringify({ candidateId: "candidate-1" }),
  });
}

describe("internal moderation send endpoint", () => {
  it.each([
    "candidate_load_failed",
    "candidate_not_found",
    "candidate_not_pending",
    "candidate_media_missing",
    "signed_url_failed",
    "telegram_send_failed",
    "configuration_missing",
  ] as const)("returns and logs only the safe %s code", async (code) => {
    process.env.INTERNAL_EVENT_API_SECRET = "internal-secret";
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const handler = createSendCandidateForModerationHandler(vi.fn().mockRejectedValue(new ModerationSendError(code)));

    const response = await handler(request());

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ error: code });
    expect(log).toHaveBeenCalledWith(`[event-moderation-send] ${code}`);
    log.mockRestore();
  });

  it("maps unexpected errors without exposing their details", async () => {
    process.env.INTERNAL_EVENT_API_SECRET = "internal-secret";
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const handler = createSendCandidateForModerationHandler(vi.fn().mockRejectedValue(new Error("secret URL and API body")));

    const response = await handler(request());

    await expect(response.json()).resolves.toEqual({ error: "unknown_error" });
    expect(log).toHaveBeenCalledWith("[event-moderation-send] unknown_error");
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining("secret URL"));
    log.mockRestore();
  });
});
