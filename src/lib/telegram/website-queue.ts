import "server-only";
import { EventWebsiteAdminService, type WebsiteQueueState } from "@/lib/events/website-admin";
import { getAbsoluteUrl } from "@/lib/site-url";
import type { InlineKeyboardMarkup } from "@/lib/telegram/client";

export type WebsiteQueueSummary = {
  text: string;
  replyMarkup: InlineKeyboardMarkup;
};

export function isWebsiteQueueCommand(value: unknown): boolean {
  return typeof value === "string" && /^\/site(?:@[A-Za-z0-9_]+)?(?:\s|$)/i.test(value.trim());
}

export function formatWebsiteQueueSummary(
  counts: Record<WebsiteQueueState, number>,
  adminUrl: string,
): WebsiteQueueSummary {
  const waiting = counts.unreviewed + counts.draft;
  return {
    text: [
      "Очередь событий для сайта",
      "",
      `Ждут проверки: ${counts.unreviewed}`,
      `Черновики: ${counts.draft}`,
      `Опубликовано: ${counts.published}`,
      `Пропущено: ${counts.skipped}`,
      "",
      waiting > 0
        ? `Всего требуют внимания: ${waiting}`
        : "Сейчас всё обработано.",
    ].join("\n"),
    replyMarkup: {
      inline_keyboard: [[{ text: "Открыть очередь сайта", url: adminUrl }]],
    },
  };
}

export async function getWebsiteQueueSummary(): Promise<WebsiteQueueSummary> {
  const adminUrl = getAbsoluteUrl("/admin/events");
  if (!adminUrl) throw new Error("SITE_URL is required for the website event queue link.");

  const queue = await new EventWebsiteAdminService().getQueue(false);
  const counts: Record<WebsiteQueueState, number> = {
    unreviewed: 0,
    draft: 0,
    published: 0,
    skipped: 0,
  };
  queue.forEach((item) => { counts[item.state] += 1; });
  return formatWebsiteQueueSummary(counts, adminUrl);
}
