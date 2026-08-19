import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleSupabaseClient } from "../supabase/service-role";

const BUCKET = "event-media";

export interface WhatsAppEventInput {
  image: File;
  sourceGroupId: string;
  sourceGroupName: string;
  sourceSenderId: string;
  sourceSenderName: string;
  sourceMessageId: string;
  caption: string;
  receivedAt: string;
  extension: string;
}

export interface IngestionResult {
  candidateId: string;
}

interface CandidateRow { id: string }

export class WhatsAppEventIngester {
  constructor(private readonly suppliedClient?: SupabaseClient) {}

  private get client(): SupabaseClient {
    return this.suppliedClient ?? createServiceRoleSupabaseClient();
  }

  async ingest(input: WhatsAppEventInput): Promise<IngestionResult> {
    const existing = await this.findCandidate(input.sourceMessageId);
    if (existing) return { candidateId: existing.id };

    const candidateId = randomUUID();
    const mediaPath = `whatsapp/${candidateId}/source.${input.extension}`;
    const bytes = await input.image.arrayBuffer();
    const upload = await this.client.storage.from(BUCKET).upload(mediaPath, bytes, {
      contentType: input.image.type,
      upsert: false,
    });
    if (upload.error) throw new Error("media_upload_failed");

    const collectionTimestamp = new Date().toISOString();
    const inserted = await this.client.from("event_candidates").insert({
      id: candidateId,
      source_type: "whatsapp",
      source_group_id: input.sourceGroupId,
      source_group_name: input.sourceGroupName,
      source_sender_id: input.sourceSenderId,
      source_sender_name: input.sourceSenderName,
      anchor_message_id: input.sourceMessageId,
      original_text: input.caption,
      media_path: mediaPath,
      status: "pending",
      collection_started_at: collectionTimestamp,
      collection_closed_at: collectionTimestamp,
    });
    if (inserted.error) {
      await this.removeMedia(mediaPath);
      const duplicate = await this.findCandidate(input.sourceMessageId);
      if (duplicate) return { candidateId: duplicate.id };
      throw new Error("candidate_insert_failed");
    }

    const message = await this.client.from("event_candidate_messages").insert({
      candidate_id: candidateId,
      source_message_id: input.sourceMessageId,
      message_type: "image",
      text: input.caption,
      media_path: mediaPath,
      sender_id: input.sourceSenderId,
      received_at: input.receivedAt,
      sequence: 0,
    });
    if (message.error) {
      await this.client.from("event_candidates").delete().eq("id", candidateId);
      await this.removeMedia(mediaPath);
      throw new Error("message_insert_failed");
    }
    return { candidateId };
  }

  async claimModerationDispatch(candidateId: string): Promise<boolean> {
    const result = await this.client.from("event_candidates")
      .update({ moderation_dispatching_at: new Date().toISOString() })
      .eq("id", candidateId)
      .is("moderation_sent_at", null)
      .is("moderation_dispatching_at", null)
      .select("id")
      .maybeSingle<{ id: string }>();
    if (result.error) throw new Error("moderation_claim_failed");
    return result.data !== null;
  }

  async markModerationSent(candidateId: string): Promise<void> {
    const result = await this.client.from("event_candidates")
      .update({ moderation_sent_at: new Date().toISOString(), moderation_dispatching_at: null })
      .eq("id", candidateId)
      .not("moderation_dispatching_at", "is", null);
    if (result.error) throw new Error("moderation_update_failed");
  }

  async releaseModerationDispatch(candidateId: string): Promise<void> {
    const result = await this.client.from("event_candidates")
      .update({ moderation_dispatching_at: null })
      .eq("id", candidateId)
      .is("moderation_sent_at", null);
    if (result.error) throw new Error("moderation_release_failed");
  }

  private async findCandidate(sourceMessageId: string): Promise<CandidateRow | null> {
    const result = await this.client.from("event_candidates")
      .select("id")
      .eq("source_type", "whatsapp")
      .eq("anchor_message_id", sourceMessageId)
      .maybeSingle<CandidateRow>();
    if (result.error) throw new Error("candidate_lookup_failed");
    return result.data;
  }

  private async removeMedia(path: string): Promise<void> {
    try { await this.client.storage.from(BUCKET).remove([path]); } catch { /* best effort */ }
  }
}
