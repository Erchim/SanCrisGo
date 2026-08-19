import "server-only";

const SAFE_ERROR = "Telegram request failed.";

export type CallbackInlineKeyboardButton = { text: string; callback_data: string };
export type UrlInlineKeyboardButton = { text: string; url: string };
export type InlineKeyboardButton = CallbackInlineKeyboardButton | UrlInlineKeyboardButton;

export interface InlineKeyboardMarkup<TButton extends InlineKeyboardButton = InlineKeyboardButton> {
  inline_keyboard: Array<Array<TButton>>;
}

export interface InputMediaPhoto {
  type: "photo";
  media: string;
  caption?: string;
}

export class TelegramClient {
  constructor(private readonly token: string, private readonly fetcher: typeof fetch = fetch) {
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN is required.");
  }

  sendPhoto(chatId: string, photo: string, caption?: string, replyMarkup?: InlineKeyboardMarkup) {
    return this.call("sendPhoto", { chat_id: chatId, photo, caption, reply_markup: replyMarkup });
  }
  sendMessage(chatId: string, text: string, replyMarkup?: InlineKeyboardMarkup) {
    return this.call("sendMessage", { chat_id: chatId, text, reply_markup: replyMarkup });
  }
  sendMediaGroup(chatId: string, media: InputMediaPhoto[]) {
    return this.call("sendMediaGroup", { chat_id: chatId, media });
  }
  answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false) {
    return this.call("answerCallbackQuery", { callback_query_id: callbackQueryId, text, show_alert: showAlert });
  }
  editMessageReplyMarkup(chatId: string | number, messageId: number, replyMarkup?: InlineKeyboardMarkup) {
    return this.call("editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: replyMarkup ?? { inline_keyboard: [] } });
  }

  private async call(method: string, body: object) {
    try {
      const response = await this.fetcher(`https://api.telegram.org/bot${this.token}/${method}`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error();
      const result = await response.json() as { ok?: boolean };
      if (!result.ok) throw new Error();
      return result;
    } catch {
      throw new Error(SAFE_ERROR);
    }
  }
}

export function createTelegramClientFromEnv() {
  return new TelegramClient(process.env.TELEGRAM_BOT_TOKEN ?? "");
}
