import "server-only";
import { createServiceRoleSupabaseClient } from "../supabase/service-role";
import { createEventPublicationService, type InstagramPublicationResult } from "./publication-service";
import { SupabaseEventModerationRepository, type EventModerationRepository } from "./moderation-repository";

export class EventModerationServiceError extends Error {
  constructor(message: string) { super(message); this.name = "EventModerationServiceError"; }
}

export class EventModerationService {
  constructor(private readonly dependencies: {
    repository: EventModerationRepository;
    publishCandidate(candidateId: string): Promise<InstagramPublicationResult>;
  }) {}

  async approve(candidateId: string): Promise<InstagramPublicationResult> {
    const id = requiredId(candidateId);
    const candidate = await this.dependencies.repository.getCandidate(id);
    if (!candidate) throw new EventModerationServiceError("Event candidate was not found.");
    if (candidate.status === "rejected") throw new EventModerationServiceError("A rejected candidate cannot be published.");
    if (candidate.status !== "pending" && candidate.status !== "approved") {
      throw new EventModerationServiceError("Candidate is not ready for moderation.");
    }
    if (candidate.status === "pending" && !await this.dependencies.repository.approvePending(id)) {
      const current = await this.dependencies.repository.getCandidate(id);
      if (current?.status !== "approved") {
        throw new EventModerationServiceError("Candidate is no longer available for approval.");
      }
    }
    return this.dependencies.publishCandidate(id);
  }

  async reject(candidateId: string): Promise<{ alreadyRejected: boolean }> {
    const id = requiredId(candidateId);
    const candidate = await this.dependencies.repository.getCandidate(id);
    if (!candidate) throw new EventModerationServiceError("Event candidate was not found.");
    if (candidate.status === "rejected") return { alreadyRejected: true };
    if (candidate.status !== "pending") {
      throw new EventModerationServiceError("An approved candidate cannot be rejected.");
    }
    if (await this.dependencies.repository.rejectPending(id)) return { alreadyRejected: false };
    const current = await this.dependencies.repository.getCandidate(id);
    if (current?.status === "rejected") return { alreadyRejected: true };
    throw new EventModerationServiceError("Candidate is no longer available for rejection.");
  }
}

export function createEventModerationService() {
  const publication = createEventPublicationService();
  return new EventModerationService({
    repository: new SupabaseEventModerationRepository(createServiceRoleSupabaseClient()),
    publishCandidate: (id) => publication.publishCandidateToInstagram(id),
  });
}

function requiredId(value: string) {
  const id = value.trim();
  if (!id) throw new EventModerationServiceError("candidateId is required.");
  return id;
}
