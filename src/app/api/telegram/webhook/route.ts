import { NextResponse } from "next/server";
import { createEventModerationService, type EventModerationService } from "@/lib/events/moderation-service";
import { secretsMatch } from "@/lib/server-secret";
import { createTelegramClientFromEnv, type TelegramClient } from "@/lib/telegram/client";
import { parseModerationCallback } from "@/lib/telegram/moderation";

interface TelegramUpdate { callback_query?: { id?: unknown; data?: unknown; message?: { message_id?: unknown; chat?: { id?: unknown } } } }
type WebhookDependencies = {
  secret: string | undefined;
  moderation: Pick<EventModerationService, "approve" | "reject">;
  telegram: Pick<TelegramClient, "answerCallbackQuery" | "editMessageReplyMarkup">;
};

export function createTelegramWebhookHandler(dependencies: WebhookDependencies) {
  return async (request: Request) => {
    if (!secretsMatch(request.headers.get("x-telegram-bot-api-secret-token"), dependencies.secret)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    let update: TelegramUpdate;
    try { update = await request.json() as TelegramUpdate; } catch { return NextResponse.json({ ok: true }); }
    const query = update.callback_query;
    const parsed = parseModerationCallback(query?.data);
    if (!parsed || typeof query?.id !== "string") return NextResponse.json({ ok: true });

    try {
      if (parsed.action === "approve") await dependencies.moderation.approve(parsed.candidateId);
      else await dependencies.moderation.reject(parsed.candidateId);
      await dependencies.telegram.answerCallbackQuery(query.id, parsed.action === "approve" ? "Published to Instagram." : "Candidate rejected.");
      if (typeof query.message?.chat?.id === "number" || typeof query.message?.chat?.id === "string") {
        if (typeof query.message.message_id === "number") {
          await dependencies.telegram.editMessageReplyMarkup(query.message.chat.id, query.message.message_id);
        }
      }
    } catch {
      // Keep Publish available after an Instagram failure (and for other recoverable errors).
      try { await dependencies.telegram.answerCallbackQuery(query.id, "Action failed. You can try again.", true); } catch { /* Telegram will retry the webhook if needed. */ }
    }
    return NextResponse.json({ ok: true });
  };
}

export async function POST(request: Request) {
  if (!secretsMatch(request.headers.get("x-telegram-bot-api-secret-token"), process.env.TELEGRAM_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  return createTelegramWebhookHandler({
    secret: process.env.TELEGRAM_WEBHOOK_SECRET,
    moderation: createEventModerationService(),
    telegram: createTelegramClientFromEnv(),
  })(request);
}
