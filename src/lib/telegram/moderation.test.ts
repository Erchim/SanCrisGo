import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { TelegramClient } from "./client";
import { callbackData, moderationKeyboard, moderationSendErrorCode, parseModerationCallback, TELEGRAM_CALLBACK_LIMIT_BYTES, TelegramModerationDispatcher } from "./moderation";

const id = "123e4567-e89b-12d3-a456-426614174000";
describe("Telegram moderation", () => {
  it("parses only expected callbacks", () => {
    expect(parseModerationCallback(`evt:a:${id}`)).toEqual({ action: "approve", candidateId: id });
    expect(parseModerationCallback(`evt:r:${id}`)?.action).toBe("reject");
    for (const invalid of [`evt:x:${id}`, `evt:a:${id}:extra`, "evt:a:not-a-uuid", null, 1]) expect(parseModerationCallback(invalid)).toBeNull();
  });
  it("keeps callback_data inside Telegram's limit", () => {
    const keyboard = moderationKeyboard(id);
    for (const button of keyboard.inline_keyboard.flat()) expect(Buffer.byteLength(button.callback_data)).toBeLessThanOrEqual(TELEGRAM_CALLBACK_LIMIT_BYTES);
    expect(callbackData("approve", id)).toBe(`evt:a:${id}`);
  });
  it("uses a separate text message and leaves buttons clear for long captions", async () => {
    const telegram = { sendPhoto: vi.fn().mockResolvedValue({}), sendMessage: vi.fn().mockResolvedValue({}) };
    const dispatcher = new TelegramModerationDispatcher({
      getCandidate: vi.fn().mockResolvedValue({ id, status: "pending", media_path: "event.jpg", original_text: "x".repeat(1100), source_group_name: "Group", source_sender_name: "Sender" }),
      createSignedUrl: vi.fn().mockResolvedValue("https://signed.example/private"), telegram, chatId: "chat",
    });
    await dispatcher.sendCandidateForModeration(id);
    expect(telegram.sendPhoto).toHaveBeenCalledWith("chat", "https://signed.example/private");
    expect(telegram.sendMessage.mock.calls[0][2]).toEqual(moderationKeyboard(id));
  });
  it("does not expose the bot token or signed URL in Telegram errors", async () => {
    const token = "very-secret-bot-token";
    const signedUrl = "https://signed.example/file?token=private";
    const client = new TelegramClient(token, vi.fn().mockRejectedValue(new Error(`failure ${signedUrl}`)) as typeof fetch);
    let error: Error | undefined;
    try { await client.sendPhoto("chat", signedUrl); } catch (caught) { error = caught as Error; }
    expect(error?.message).toBe("Telegram request failed.");
    expect(error?.message).not.toContain(token);
    expect(error?.message).not.toContain(signedUrl);
  });

  it.each([
    ["candidate_load_failed", { getCandidate: vi.fn().mockRejectedValue(new Error("database details")) }],
    ["candidate_not_found", { getCandidate: vi.fn().mockResolvedValue(null) }],
    ["candidate_not_pending", { candidate: { status: "approved" } }],
    ["candidate_media_missing", { candidate: { media_path: null } }],
    ["signed_url_failed", { createSignedUrl: vi.fn().mockRejectedValue(new Error("signed URL details")) }],
    ["telegram_send_failed", { sendPhoto: vi.fn().mockRejectedValue(new Error("Telegram response body")) }],
  ])("maps a dispatch failure to %s", async (expectedCode, overrides) => {
    const candidate = { id, status: "pending", media_path: "event.jpg", original_text: "Event", source_group_name: null, source_sender_name: null, ...("candidate" in overrides ? overrides.candidate : {}) };
    const dispatcher = new TelegramModerationDispatcher({
      getCandidate: "getCandidate" in overrides ? overrides.getCandidate : vi.fn().mockResolvedValue(candidate),
      createSignedUrl: "createSignedUrl" in overrides ? overrides.createSignedUrl : vi.fn().mockResolvedValue("https://signed.example/private"),
      telegram: {
        sendPhoto: "sendPhoto" in overrides ? overrides.sendPhoto : vi.fn().mockResolvedValue({}),
        sendMessage: vi.fn().mockResolvedValue({}),
      },
      chatId: "chat",
    });

    await expect(dispatcher.sendCandidateForModeration(id)).rejects.toMatchObject({ code: expectedCode, message: expectedCode });
  });

  it("maps unclassified failures to unknown_error", () => {
    expect(moderationSendErrorCode(new Error("sensitive details"))).toBe("unknown_error");
  });
});
