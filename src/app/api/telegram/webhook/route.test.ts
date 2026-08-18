import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { createTelegramWebhookHandler } from "./route";

describe("Telegram webhook", () => {
  it("rejects an incorrect webhook secret", async () => {
    const moderation = { approve: vi.fn(), reject: vi.fn() };
    const handler = createTelegramWebhookHandler({ secret: "correct", moderation, telegram: { answerCallbackQuery: vi.fn(), editMessageReplyMarkup: vi.fn() } });
    const response = await handler(new Request("http://localhost/api/telegram/webhook", { method: "POST", headers: { "x-telegram-bot-api-secret-token": "wrong" }, body: "{}" }));
    expect(response.status).toBe(401);
    expect(moderation.approve).not.toHaveBeenCalled();
  });
});
