import "server-only";
import { createInstagramPublisherFromEnv } from "../instagram/publisher";
import { createEventMediaSignedUrl } from "../supabase/event-media";
import { createServiceRoleSupabaseClient } from "../supabase/service-role";
import {
  type EventPublicationRepository,
  type InstagramPublication,
  SupabaseEventPublicationRepository,
} from "./publication-repository";

const SAFE_PUBLICATION_ERROR = "Instagram publication failed.";

interface InstagramImagePublisher {
  publishImage(input: { imageUrl: string; caption: string }): Promise<string>;
}

export interface EventPublicationServiceDependencies {
  repository: EventPublicationRepository;
  instagramPublisher: InstagramImagePublisher;
  createSignedUrl(mediaPath: string): Promise<string>;
  now?: () => Date;
}

export interface InstagramPublicationResult {
  publicationId: string;
  instagramMediaId: string;
  alreadyPublished: boolean;
}

export class EventPublicationServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EventPublicationServiceError";
  }
}

export class EventPublicationService {
  private readonly now: () => Date;

  constructor(private readonly dependencies: EventPublicationServiceDependencies) {
    this.now = dependencies.now ?? (() => new Date());
  }

  async publishCandidateToInstagram(candidateId: string): Promise<InstagramPublicationResult> {
    const normalizedCandidateId = candidateId.trim();
    if (!normalizedCandidateId) {
      throw new EventPublicationServiceError("candidateId is required.");
    }

    const candidate = await this.dependencies.repository.getCandidate(normalizedCandidateId);
    if (!candidate) {
      throw new EventPublicationServiceError("Event candidate was not found.");
    }
    if (candidate.status !== "approved") {
      throw new EventPublicationServiceError("Only approved event candidates can be published.");
    }
    if (!candidate.mediaPath?.trim()) {
      throw new EventPublicationServiceError("Event candidate media_path is required.");
    }

    const publication = await this.dependencies.repository
      .getOrCreateInstagramPublication(candidate.id);
    const existingResult = publishedResult(publication);
    if (existingResult) {
      return existingResult;
    }

    const claimed = await this.dependencies.repository.claimForPublishing(
      publication.id,
      candidate.originalText,
    );
    if (!claimed) {
      const currentPublication = await this.dependencies.repository.getPublication(publication.id);
      const concurrentlyPublishedResult = publishedResult(currentPublication);
      if (concurrentlyPublishedResult) {
        return concurrentlyPublishedResult;
      }
      throw new EventPublicationServiceError("Instagram publication is already in progress.");
    }

    let instagramMediaId: string;
    try {
      const imageUrl = await this.dependencies.createSignedUrl(candidate.mediaPath);
      instagramMediaId = await this.dependencies.instagramPublisher.publishImage({
        imageUrl,
        caption: candidate.originalText,
      });
    } catch {
      await this.dependencies.repository.markFailed(publication.id, SAFE_PUBLICATION_ERROR);
      throw new EventPublicationServiceError(SAFE_PUBLICATION_ERROR);
    }

    // Keep the row in `publishing` if this write fails. Marking it failed would
    // allow a retry to create a duplicate post after Instagram already succeeded.
    await this.dependencies.repository.markPublished(
      publication.id,
      instagramMediaId,
      this.now().toISOString(),
    );

    return {
      publicationId: publication.id,
      instagramMediaId,
      alreadyPublished: false,
    };
  }
}

export function createEventPublicationService(): EventPublicationService {
  const client = createServiceRoleSupabaseClient();
  return new EventPublicationService({
    repository: new SupabaseEventPublicationRepository(client),
    instagramPublisher: createInstagramPublisherFromEnv(),
    createSignedUrl: (mediaPath) => createEventMediaSignedUrl(mediaPath, undefined, client),
  });
}

export async function publishCandidateToInstagram(
  candidateId: string,
): Promise<InstagramPublicationResult> {
  return createEventPublicationService().publishCandidateToInstagram(candidateId);
}

function publishedResult(publication: InstagramPublication): InstagramPublicationResult | null {
  if (publication.status !== "published" || !publication.externalId) {
    return null;
  }

  return {
    publicationId: publication.id,
    instagramMediaId: publication.externalId,
    alreadyPublished: true,
  };
}
