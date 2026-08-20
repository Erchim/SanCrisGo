import "server-only";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleSupabaseClient } from "../supabase/service-role";

const BUCKET = "event-media";

export interface WhatsAppEventImageInput {
  image: File;
  sourceMessageId: string;
  receivedAt: string;
  extension: string;
}

export interface WhatsAppEventInput {
  images: WhatsAppEventImageInput[];
  sourceGroupId: string;
  sourceGroupName: string;
  sourceSenderId: string;
  sourceSenderName: string;
  caption: string;
}

export interface IngestionResult {
  candidateId: string;
  created: boolean;
}

interface CandidateRow { id: string }

export class WhatsAppEventIngester {
  constructor(private readonly suppliedClient?: SupabaseClient) {}

  private get client(): SupabaseClient {
    return this.suppliedClient ?? createServiceRoleSupabaseClient();
  }

  async ingest(input: WhatsAppEventInput): Promise<IngestionResult> {
    const anchorMessageId = input.images[0]?.sourceMessageId;
    if (!anchorMessageId) throw new Error("image_missing");

    const existing = await this.findCandidate(anchorMessageId);
    if (existing) return { candidateId: existing.id, created: false };

    const candidateId = randomUUID();
    const mediaPaths = input.images.map((image, sequence) =>
      `whatsapp/${candidateId}/${String(sequence).padStart(3, "0")}.${image.extension}`
    );
    const uploadedPaths: string[] = [];
    for (const [index, image] of input.images.entries()) {
      const bytes = await image.image.arrayBuffer();
      const upload = await this.client.storage.from(BUCKET).upload(mediaPaths[index], bytes, {
        contentType: image.image.type,
        upsert: false,
      });
      if (upload.error) {
        await this.removeMedia(uploadedPaths);
        throw new Error("media_upload_failed");
      }
      uploadedPaths.push(mediaPaths[index]);
    }

    const collectionTimestamp = new Date().toISOString();
    const inserted = await this.client.from("event_candidates").insert({
      id: candidateId,
      source_type: "whatsapp",
      source_group_id: input.sourceGroupId,
      source_group_name: input.sourceGroupName,
      source_sender_id: input.sourceSenderId,
      source_sender_name: input.sourceSenderName,
      anchor_message_id: anchorMessageId,
      original_text: input.caption,
      media_path: mediaPaths[0],
      status: "pending",
      collection_started_at: collectionTimestamp,
      collection_closed_at: collectionTimestamp,
    });
    if (inserted.error) {
      await this.removeMedia(mediaPaths);
      const duplicate = await this.findCandidate(anchorMessageId);
      if (duplicate) return { candidateId: duplicate.id, created: false };
      throw new Error("candidate_insert_failed");
    }

    const message = await this.client.from("event_candidate_messages").insert(
      input.images.map((image, sequence) => ({
        candidate_id: candidateId,
        source_message_id: image.sourceMessageId,
        message_type: "image",
        text: sequence === 0 ? input.caption : "",
        media_path: mediaPaths[sequence],
        sender_id: input.sourceSenderId,
        received_at: image.receivedAt,
        sequence,
      })),
    );
    if (message.error) {
      await this.client.from("event_candidates").delete().eq("id", candidateId);
      await this.removeMedia(mediaPaths);
      throw new Error("message_insert_failed");
    }
    return { candidateId, created: true };
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

  private async removeMedia(paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    try { await this.client.storage.from(BUCKET).remove(paths); } catch { /* best effort */ }
  }
}
