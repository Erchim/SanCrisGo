import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ModerationCandidate {
  id: string;
  status: string;
}

export interface EventModerationRepository {
  getCandidate(candidateId: string): Promise<ModerationCandidate | null>;
  approvePending(candidateId: string): Promise<boolean>;
  rejectPending(candidateId: string): Promise<boolean>;
}

export class SupabaseEventModerationRepository implements EventModerationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCandidate(candidateId: string): Promise<ModerationCandidate | null> {
    const { data, error } = await this.client.from("event_candidates")
      .select("id,status").eq("id", candidateId).maybeSingle<ModerationCandidate>();
    if (error) throw new Error("Could not load the event candidate.");
    return data;
  }

  async approvePending(candidateId: string): Promise<boolean> {
    return this.compareAndSet(candidateId, "approved");
  }

  async rejectPending(candidateId: string): Promise<boolean> {
    return this.compareAndSet(candidateId, "rejected");
  }

  private async compareAndSet(candidateId: string, status: "approved" | "rejected") {
    const { data, error } = await this.client.from("event_candidates").update({ status })
      .eq("id", candidateId).eq("status", "pending").select("id").maybeSingle<{ id: string }>();
    if (error) throw new Error("Could not update the event candidate.");
    return data !== null;
  }
}
