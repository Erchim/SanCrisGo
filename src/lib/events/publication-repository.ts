import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface EventCandidateForPublication {
  id: string;
  status: string;
  mediaPath: string | null;
  originalText: string;
}

export interface InstagramPublication {
  id: string;
  candidateId: string;
  status: string;
  externalId: string | null;
}

export interface EventPublicationRepository {
  getCandidate(candidateId: string): Promise<EventCandidateForPublication | null>;
  getOrCreateInstagramPublication(candidateId: string): Promise<InstagramPublication>;
  getPublication(publicationId: string): Promise<InstagramPublication>;
  claimForPublishing(publicationId: string, caption: string): Promise<boolean>;
  markPublished(publicationId: string, externalId: string, publishedAt: string): Promise<void>;
  markFailed(publicationId: string, safeError: string): Promise<void>;
}

interface CandidateRow {
  id: string;
  status: string;
  media_path: string | null;
  original_text: string;
}

interface PublicationRow {
  id: string;
  candidate_id: string;
  status: string;
  external_id: string | null;
}

export class SupabaseEventPublicationRepository implements EventPublicationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCandidate(candidateId: string): Promise<EventCandidateForPublication | null> {
    const { data, error } = await this.client
      .from("event_candidates")
      .select("id,status,media_path,original_text")
      .eq("id", candidateId)
      .maybeSingle<CandidateRow>();

    if (error) {
      throw new Error("Could not load the event candidate.");
    }
    if (!data) {
      return null;
    }

    return {
      id: data.id,
      status: data.status,
      mediaPath: data.media_path,
      originalText: data.original_text,
    };
  }

  async getOrCreateInstagramPublication(candidateId: string): Promise<InstagramPublication> {
    const { error } = await this.client.from("event_publications").upsert(
      { candidate_id: candidateId, channel: "instagram", status: "pending" },
      {
        onConflict: "candidate_id,channel",
        ignoreDuplicates: true,
      },
    );

    if (error) {
      throw new Error("Could not create the Instagram publication record.");
    }

    const { data, error: selectError } = await this.client
      .from("event_publications")
      .select("id,candidate_id,status,external_id")
      .eq("candidate_id", candidateId)
      .eq("channel", "instagram")
      .single<PublicationRow>();

    if (selectError || !data) {
      throw new Error("Could not load the Instagram publication record.");
    }

    return mapPublication(data);
  }

  async getPublication(publicationId: string): Promise<InstagramPublication> {
    const { data, error } = await this.client
      .from("event_publications")
      .select("id,candidate_id,status,external_id")
      .eq("id", publicationId)
      .single<PublicationRow>();

    if (error || !data) {
      throw new Error("Could not reload the Instagram publication record.");
    }

    return mapPublication(data);
  }

  async claimForPublishing(publicationId: string, caption: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("event_publications")
      .update({ status: "publishing", caption, error: null, published_at: null })
      .eq("id", publicationId)
      .in("status", ["pending", "failed"])
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      throw new Error("Could not claim the Instagram publication record.");
    }

    return data !== null;
  }

  async markPublished(
    publicationId: string,
    externalId: string,
    publishedAt: string,
  ): Promise<void> {
    const { error } = await this.client
      .from("event_publications")
      .update({
        status: "published",
        external_id: externalId,
        published_at: publishedAt,
        error: null,
      })
      .eq("id", publicationId);

    if (error) {
      throw new Error("Could not mark the Instagram publication as published.");
    }
  }

  async markFailed(publicationId: string, safeError: string): Promise<void> {
    const { error } = await this.client
      .from("event_publications")
      .update({ status: "failed", published_at: null, error: safeError })
      .eq("id", publicationId);

    if (error) {
      throw new Error("Could not mark the Instagram publication as failed.");
    }
  }
}

function mapPublication(row: PublicationRow): InstagramPublication {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    status: row.status,
    externalId: row.external_id,
  };
}
