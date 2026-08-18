import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createEventMediaSignedUrl } from "../supabase/event-media";
import { createServiceRoleSupabaseClient } from "../supabase/service-role";
import { createTelegramClientFromEnv, type InlineKeyboardMarkup, type TelegramClient } from "./client";

const CAPTION_LIMIT = 1024;
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
export const TELEGRAM_CALLBACK_LIMIT_BYTES = 64;

export type ModerationAction = "approve" | "reject";
export type ModerationSendErrorCode =
  | "candidate_load_failed"
  | "candidate_not_found"
  | "candidate_not_pending"
  | "candidate_media_missing"
  | "signed_url_failed"
  | "telegram_send_failed"
  | "configuration_missing"
  | "unknown_error";

export class ModerationSendError extends Error {
  constructor(readonly code: Exclude<ModerationSendErrorCode, "unknown_error">) {
    super(code);
    this.name = "ModerationSendError";
  }
}

export function moderationSendErrorCode(error: unknown): ModerationSendErrorCode {
  return error instanceof ModerationSendError ? error.code : "unknown_error";
}

export function callbackData(action: ModerationAction, candidateId: string) {
  return `evt:${action === "approve" ? "a" : "r"}:${candidateId}`;
}
export function parseModerationCallback(data: unknown): { action: ModerationAction; candidateId: string } | null {
  if (typeof data !== "string") return null;
  const match = new RegExp(`^evt:([ar]):(${UUID})$`, "i").exec(data);
  return match ? { action: match[1].toLowerCase() === "a" ? "approve" : "reject", candidateId: match[2].toLowerCase() } : null;
}

interface DispatchCandidate { id: string; status: string; media_path: string | null; original_text: string; source_group_name: string | null; source_sender_name: string | null; }
export class TelegramModerationDispatcher {
  constructor(private readonly dependencies: { getCandidate(id: string): Promise<DispatchCandidate | null>; createSignedUrl(path: string): Promise<string>; telegram: Pick<TelegramClient, "sendPhoto" | "sendMessage">; chatId: string; }) {}
  async sendCandidateForModeration(candidateId: string) {
    let candidate: DispatchCandidate | null;
    try {
      candidate = await this.dependencies.getCandidate(candidateId.trim());
    } catch {
      throw new ModerationSendError("candidate_load_failed");
    }
    if (!candidate) throw new ModerationSendError("candidate_not_found");
    if (candidate.status !== "pending") throw new ModerationSendError("candidate_not_pending");
    if (!candidate.media_path) throw new ModerationSendError("candidate_media_missing");
    let url: string;
    try {
      url = await this.dependencies.createSignedUrl(candidate.media_path);
    } catch {
      throw new ModerationSendError("signed_url_failed");
    }
    const text = formatCandidate(candidate);
    const keyboard = moderationKeyboard(candidate.id);
    try {
      if (text.length <= CAPTION_LIMIT) return await this.dependencies.telegram.sendPhoto(this.dependencies.chatId, url, text, keyboard);
      await this.dependencies.telegram.sendPhoto(this.dependencies.chatId, url);
      return await this.dependencies.telegram.sendMessage(this.dependencies.chatId, text, keyboard);
    } catch {
      throw new ModerationSendError("telegram_send_failed");
    }
  }
}

export function moderationKeyboard(id: string): InlineKeyboardMarkup {
  return { inline_keyboard: [[{ text: "✅ Publish", callback_data: callbackData("approve", id) }, { text: "❌ Reject", callback_data: callbackData("reject", id) }]] };
}
function formatCandidate(c: DispatchCandidate) {
  return `Source/group: ${c.source_group_name || "Unknown"}\nSender: ${c.source_sender_name || "Unknown"}\nCandidate ID: ${c.id}\n\n${c.original_text || "(no text)"}`;
}
export function createTelegramModerationDispatcher(client: SupabaseClient = createServiceRoleSupabaseClient()) {
  const chatId = process.env.TELEGRAM_MODERATION_CHAT_ID;
  if (!chatId) throw new Error("TELEGRAM_MODERATION_CHAT_ID is required.");
  return new TelegramModerationDispatcher({
    getCandidate: async (id) => {
      const { data, error } = await client.from("event_candidates").select("id,status,media_path,original_text,source_group_name,source_sender_name").eq("id", id).maybeSingle<DispatchCandidate>();
      if (error) throw new Error("Could not load the event candidate.");
      return data;
    },
    createSignedUrl: (path) => createEventMediaSignedUrl(path, undefined, client), telegram: createTelegramClientFromEnv(), chatId,
  });
}
export function sendCandidateForModeration(id: string) {
  if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.TELEGRAM_BOT_TOKEN ||
    !process.env.TELEGRAM_MODERATION_CHAT_ID
  ) {
    throw new ModerationSendError("configuration_missing");
  }
  return createTelegramModerationDispatcher().sendCandidateForModeration(id);
}
