import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { formatWebsiteQueueSummary, isWebsiteQueueCommand } from "./website-queue";

describe("Telegram website queue summary", () => {
  it("recognizes the dedicated command without touching callback data", () => {
    expect(isWebsiteQueueCommand("/site")).toBe(true);
    expect(isWebsiteQueueCommand("/site@sancrisgo_bot")).toBe(true);
    expect(isWebsiteQueueCommand("evt:a:103e4cf0-0a68-4df8-a3f5-f9d982832421")).toBe(false);
  });

  it("returns one stable admin link with queue totals", () => {
    const summary = formatWebsiteQueueSummary({
      unreviewed: 7,
      draft: 3,
      published: 12,
      skipped: 2,
    }, "https://sancrisgo.com/admin/events");

    expect(summary.text).toContain("Всего требуют внимания: 10");
    expect(summary.replyMarkup.inline_keyboard).toEqual([[
      { text: "Открыть очередь сайта", url: "https://sancrisgo.com/admin/events" },
    ]]);
  });
});
