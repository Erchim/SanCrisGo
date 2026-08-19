import { NextResponse } from "next/server";
import { createEventModerationService, type EventModerationService } from "@/lib/events/moderation-service";
import { secretsMatch } from "@/lib/server-secret";
import { createTelegramClientFromEnv, type TelegramClient } from "@/lib/telegram/client";
import { parseModerationCallback } from "@/lib/telegram/moderation";
import { getWebsiteQueueSummary, isWebsiteQueueCommand, type WebsiteQueueSummary } from "@/lib/telegram/website-queue";

type TelegramMessage = { text?: unknown; chat?: { id?: unknown } };
type TelegramCallbackQuery = {
  id?: unknown;
  data?: unknown;
  message?: { message_id?: unknown; chat?: { id?: unknown } };
};
interface TelegramUpdate {
  [key: string]: unknown;
  update_id?: unknown;
  callback_query?: TelegramCallbackQuery;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  business_message?: TelegramMessage;
  edited_business_message?: TelegramMessage;
}
type TelegramMessageSource =
  | "message"
  | "edited_message"
  | "business_message"
  | "edited_business_message";
type WebhookDependencies = {
  secret: string | undefined;
  moderation: Pick<EventModerationService, "approve" | "reject">;
  telegram: Pick<TelegramClient, "answerCallbackQuery" | "editMessageReplyMarkup">
    & Partial<Pick<TelegramClient, "sendMessage">>;
  moderationChatId?: string;
  getWebsiteSummary?: () => Promise<WebsiteQueueSummary>;
};

export function createTelegramWebhookHandler(dependencies: WebhookDependencies) {
  return async (request: Request) => {
    if (!secretsMatch(request.headers.get("x-telegram-bot-api-secret-token"), dependencies.secret)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    let update: TelegramUpdate;
    try {
      const body: unknown = await request.json();
      update = isRecord(body) ? body as TelegramUpdate : {};
    } catch {
      return NextResponse.json({ ok: true });
    }

    const query = asCallbackQuery(update.callback_query);
    const commandMessage = getCommandMessage(update);
    const message = commandMessage?.message;
    const websiteQueueCommand = isWebsiteQueueCommand(message?.text);

    console.info("[telegram/webhook] update received", {
      hasUpdateId: Object.hasOwn(update, "update_id"),
      topLevelKeys: Object.keys(update).sort(),
      hasMessage: Boolean(asMessage(update.message)),
      hasEditedMessage: Boolean(asMessage(update.edited_message)),
      hasBusinessMessage: Boolean(asMessage(update.business_message)),
      hasEditedBusinessMessage: Boolean(asMessage(update.edited_business_message)),
      hasCallbackQuery: Boolean(query),
      messageSource: commandMessage?.source ?? "none",
      textType: typeof message?.text,
      hasChatId: hasChatId(message),
      websiteQueueCommand,
    });

    if (websiteQueueCommand) {
      const incomingChatId = typeof message?.chat?.id === "number" || typeof message?.chat?.id === "string"
        ? String(message.chat.id).trim()
        : undefined;
      const configuredChatId = dependencies.moderationChatId?.trim();
      const chatMatches = incomingChatId !== undefined
        && Boolean(configuredChatId)
        && incomingChatId === configuredChatId;

      console.info("[telegram/site] command received", {
        hasIncomingChatId: incomingChatId !== undefined,
        hasConfiguredChatId: Boolean(configuredChatId),
        chatMatches,
      });

      if (!dependencies.telegram.sendMessage || incomingChatId === undefined) {
        return NextResponse.json({ ok: true });
      }

      if (!chatMatches || !dependencies.getWebsiteSummary) {
        await sendWebsiteQueueMessage(
          dependencies.telegram.sendMessage.bind(dependencies.telegram),
          incomingChatId,
          "Команда /site недоступна в этом чате.",
          undefined,
          "unavailable",
        );
        return NextResponse.json({ ok: true });
      }

      try {
        const summary = await dependencies.getWebsiteSummary();
        await sendWebsiteQueueMessage(
          dependencies.telegram.sendMessage.bind(dependencies.telegram),
          incomingChatId,
          summary.text,
          summary.replyMarkup,
          "summary",
        );
      } catch (error) {
        console.warn("[telegram/site] queue response failed", {
          errorClass: getErrorClass(error),
        });
        await sendWebsiteQueueMessage(
          dependencies.telegram.sendMessage.bind(dependencies.telegram),
          incomingChatId,
          "Не удалось загрузить очередь сайта. Попробуйте команду /site ещё раз.",
          undefined,
          "retry",
        );
      }
      return NextResponse.json({ ok: true });
    }

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
    moderationChatId: process.env.TELEGRAM_MODERATION_CHAT_ID,
    getWebsiteSummary: getWebsiteQueueSummary,
  })(request);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asMessage(value: unknown): TelegramMessage | undefined {
  return isRecord(value) ? value as TelegramMessage : undefined;
}

function asCallbackQuery(value: unknown): TelegramCallbackQuery | undefined {
  return isRecord(value) ? value as TelegramCallbackQuery : undefined;
}

function getCommandMessage(update: TelegramUpdate): {
  source: TelegramMessageSource;
  message: TelegramMessage;
} | undefined {
  const sources: TelegramMessageSource[] = [
    "message",
    "edited_message",
    "business_message",
    "edited_business_message",
  ];
  for (const source of sources) {
    const message = asMessage(update[source]);
    if (message) return { source, message };
  }
  return undefined;
}

function hasChatId(message: TelegramMessage | undefined): boolean {
  return typeof message?.chat?.id === "number" || typeof message?.chat?.id === "string";
}

function getErrorClass(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}

async function sendWebsiteQueueMessage(
  sendMessage: (chatId: string, text: string, replyMarkup?: WebsiteQueueSummary["replyMarkup"]) => Promise<unknown>,
  chatId: string,
  text: string,
  replyMarkup: WebsiteQueueSummary["replyMarkup"] | undefined,
  responseType: "summary" | "unavailable" | "retry",
) {
  console.info("[telegram/site] send started", { responseType });
  try {
    await sendMessage(chatId, text, replyMarkup);
    console.info("[telegram/site] send succeeded", { responseType });
  } catch (error) {
    console.error("[telegram/site] send failed", {
      responseType,
      errorClass: getErrorClass(error),
    });
    throw error;
  }
}
