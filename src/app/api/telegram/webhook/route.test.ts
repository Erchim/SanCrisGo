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

  it("sends one website queue link for /site in the moderation chat", async () => {
    const moderation = { approve: vi.fn(), reject: vi.fn() };
    const telegram = {
      answerCallbackQuery: vi.fn(),
      editMessageReplyMarkup: vi.fn(),
      sendMessage: vi.fn(),
    };
    const summary = {
      text: "Queue summary",
      replyMarkup: { inline_keyboard: [[{ text: "Open", url: "https://sancrisgo.com/admin/events" }]] },
    };
    const handler = createTelegramWebhookHandler({
      secret: "correct",
      moderation,
      telegram,
      moderationChatId: "123",
      getWebsiteSummary: vi.fn().mockResolvedValue(summary),
    });

    const response = await handler(new Request("http://localhost/api/telegram/webhook", {
      method: "POST",
      headers: { "x-telegram-bot-api-secret-token": "correct" },
      body: JSON.stringify({ message: { text: "/site", chat: { id: 123 } } }),
    }));

    expect(response.status).toBe(200);
    expect(telegram.sendMessage).toHaveBeenCalledWith("123", summary.text, summary.replyMarkup);
    expect(moderation.approve).not.toHaveBeenCalled();
    expect(moderation.reject).not.toHaveBeenCalled();
  });

  it("normalizes whitespace in the configured moderation chat ID", async () => {
    const moderation = { approve: vi.fn(), reject: vi.fn() };
    const telegram = {
      answerCallbackQuery: vi.fn(),
      editMessageReplyMarkup: vi.fn(),
      sendMessage: vi.fn(),
    };
    const summary = {
      text: "Queue summary",
      replyMarkup: { inline_keyboard: [[{ text: "Open", url: "https://sancrisgo.com/admin/events" }]] },
    };
    const handler = createTelegramWebhookHandler({
      secret: "correct",
      moderation,
      telegram,
      moderationChatId: " 123\n",
      getWebsiteSummary: vi.fn().mockResolvedValue(summary),
    });

    await handler(new Request("http://localhost/api/telegram/webhook", {
      method: "POST",
      headers: { "x-telegram-bot-api-secret-token": "correct" },
      body: JSON.stringify({ message: { text: "/site@sancrisgo_bot", chat: { id: 123 } } }),
    }));

    expect(telegram.sendMessage).toHaveBeenCalledWith("123", summary.text, summary.replyMarkup);
  });

  it.each([
    "edited_message",
    "business_message",
    "edited_business_message",
  ])("recognizes /site from Telegram %s updates", async (messageField) => {
    const moderation = { approve: vi.fn(), reject: vi.fn() };
    const telegram = {
      answerCallbackQuery: vi.fn(),
      editMessageReplyMarkup: vi.fn(),
      sendMessage: vi.fn(),
    };
    const summary = {
      text: "Queue summary",
      replyMarkup: { inline_keyboard: [[{ text: "Open", url: "https://sancrisgo.com/admin/events" }]] },
    };
    const handler = createTelegramWebhookHandler({
      secret: "correct",
      moderation,
      telegram,
      moderationChatId: "123",
      getWebsiteSummary: vi.fn().mockResolvedValue(summary),
    });

    await handler(new Request("http://localhost/api/telegram/webhook", {
      method: "POST",
      headers: { "x-telegram-bot-api-secret-token": "correct" },
      body: JSON.stringify({ [messageField]: { text: "/site", chat: { id: 123 } } }),
    }));

    expect(telegram.sendMessage).toHaveBeenCalledWith("123", summary.text, summary.replyMarkup);
    expect(moderation.approve).not.toHaveBeenCalled();
    expect(moderation.reject).not.toHaveBeenCalled();
  });

  it("logs update shape and delivery state without message text or personal IDs", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const moderation = { approve: vi.fn(), reject: vi.fn() };
    const telegram = {
      answerCallbackQuery: vi.fn(),
      editMessageReplyMarkup: vi.fn(),
      sendMessage: vi.fn(),
    };
    const handler = createTelegramWebhookHandler({
      secret: "correct",
      moderation,
      telegram,
      moderationChatId: "private-chat-123",
      getWebsiteSummary: vi.fn().mockResolvedValue({
        text: "Queue summary",
        replyMarkup: { inline_keyboard: [[{ text: "Open", url: "https://sancrisgo.com/admin/events" }]] },
      }),
    });

    try {
      await handler(new Request("http://localhost/api/telegram/webhook", {
        method: "POST",
        headers: { "x-telegram-bot-api-secret-token": "correct" },
        body: JSON.stringify({
          update_id: 987654,
          business_message: {
            text: "/site",
            chat: { id: "private-chat-123", username: "private-user" },
            from: { first_name: "Private Name" },
          },
        }),
      }));

      const logs = JSON.stringify(info.mock.calls);
      expect(logs).toContain("business_message");
      expect(logs).not.toContain("/site");
      expect(logs).not.toContain("987654");
      expect(logs).not.toContain("private-chat-123");
      expect(logs).not.toContain("private-user");
      expect(logs).not.toContain("Private Name");
    } finally {
      info.mockRestore();
    }
  });

  it("explains when /site is sent from a different chat without exposing the queue", async () => {
    const moderation = { approve: vi.fn(), reject: vi.fn() };
    const telegram = {
      answerCallbackQuery: vi.fn(),
      editMessageReplyMarkup: vi.fn(),
      sendMessage: vi.fn(),
    };
    const getWebsiteSummary = vi.fn();
    const handler = createTelegramWebhookHandler({
      secret: "correct",
      moderation,
      telegram,
      moderationChatId: "123",
      getWebsiteSummary,
    });

    await handler(new Request("http://localhost/api/telegram/webhook", {
      method: "POST",
      headers: { "x-telegram-bot-api-secret-token": "correct" },
      body: JSON.stringify({ message: { text: "/site", chat: { id: 456 } } }),
    }));

    expect(telegram.sendMessage).toHaveBeenCalledWith("456", "Команда /site недоступна в этом чате.");
    expect(getWebsiteSummary).not.toHaveBeenCalled();
  });

  it("preserves the existing Instagram approval callback", async () => {
    const moderation = { approve: vi.fn().mockResolvedValue({}), reject: vi.fn() };
    const telegram = {
      answerCallbackQuery: vi.fn(),
      editMessageReplyMarkup: vi.fn(),
      sendMessage: vi.fn(),
    };
    const candidateId = "103e4cf0-0a68-4df8-a3f5-f9d982832421";
    const handler = createTelegramWebhookHandler({ secret: "correct", moderation, telegram });

    await handler(new Request("http://localhost/api/telegram/webhook", {
      method: "POST",
      headers: { "x-telegram-bot-api-secret-token": "correct" },
      body: JSON.stringify({
        callback_query: {
          id: "callback-1",
          data: `evt:a:${candidateId}`,
          message: { message_id: 42, chat: { id: 123 } },
        },
      }),
    }));

    expect(moderation.approve).toHaveBeenCalledWith(candidateId);
    expect(telegram.answerCallbackQuery).toHaveBeenCalledWith("callback-1", "Published to Instagram.");
    expect(telegram.editMessageReplyMarkup).toHaveBeenCalledWith(123, 42);
  });
});
