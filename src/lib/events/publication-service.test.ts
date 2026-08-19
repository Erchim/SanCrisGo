import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  EventPublicationService,
  EventPublicationServiceError,
  type EventPublicationServiceDependencies,
} from "./publication-service";
import type {
  EventCandidateForPublication,
  EventPublicationRepository,
  InstagramPublication,
} from "./publication-repository";

function createHarness(options: {
  candidate?: EventCandidateForPublication | null;
  publication?: InstagramPublication;
  instagramError?: Error;
} = {}) {
  const candidate = options.candidate === undefined ? {
    id: "candidate-1",
    status: "approved",
    mediaPaths: ["candidates/event.jpg"],
    originalText: "Original event caption",
  } : options.candidate;
  const publication = options.publication ?? {
    id: "publication-1",
    candidateId: "candidate-1",
    status: "pending",
    externalId: null,
  };
  const repository: EventPublicationRepository = {
    getCandidate: vi.fn().mockResolvedValue(candidate),
    getOrCreateInstagramPublication: vi.fn().mockResolvedValue(publication),
    getPublication: vi.fn().mockResolvedValue(publication),
    claimForPublishing: vi.fn().mockResolvedValue(true),
    markPublished: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
  };
  const instagramPublisher = {
    publishImage: options.instagramError
      ? vi.fn().mockRejectedValue(options.instagramError)
      : vi.fn().mockResolvedValue("instagram-media-1"),
    publishCarousel: vi.fn().mockResolvedValue("instagram-carousel-1"),
  };
  const createSignedUrl = vi.fn((_mediaPath: string) => Promise.resolve(
    "https://storage.example/signed.jpg?secret=temporary-secret",
  ));
  const dependencies: EventPublicationServiceDependencies = {
    repository,
    instagramPublisher,
    createSignedUrl,
    now: () => new Date("2026-08-18T12:00:00.000Z"),
  };

  return {
    service: new EventPublicationService(dependencies),
    repository,
    instagramPublisher,
    createSignedUrl,
  };
}

describe("EventPublicationService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("publishes an approved candidate and records the result", async () => {
    const harness = createHarness();

    await expect(harness.service.publishCandidateToInstagram("candidate-1")).resolves.toEqual({
      publicationId: "publication-1",
      instagramMediaId: "instagram-media-1",
      alreadyPublished: false,
    });
    expect(harness.repository.claimForPublishing).toHaveBeenCalledWith(
      "publication-1",
      "Original event caption",
    );
    expect(harness.instagramPublisher.publishImage).toHaveBeenCalledWith({
      imageUrl: "https://storage.example/signed.jpg?secret=temporary-secret",
      caption: "Original event caption",
    });
    expect(harness.repository.markPublished).toHaveBeenCalledWith(
      "publication-1",
      "instagram-media-1",
      "2026-08-18T12:00:00.000Z",
    );
  });

  it("publishes an approved image candidate without a caption", async () => {
    const harness = createHarness({
      candidate: {
        id: "candidate-1",
        status: "approved",
        mediaPaths: ["candidates/event.jpg"],
        originalText: "",
      },
    });

    await expect(harness.service.publishCandidateToInstagram("candidate-1")).resolves.toEqual({
      publicationId: "publication-1",
      instagramMediaId: "instagram-media-1",
      alreadyPublished: false,
    });
    expect(harness.repository.claimForPublishing).toHaveBeenCalledWith("publication-1", "");
    expect(harness.instagramPublisher.publishImage).toHaveBeenCalledWith({
      imageUrl: "https://storage.example/signed.jpg?secret=temporary-secret",
      caption: "",
    });
  });

  it("rejects a candidate that is not approved", async () => {
    const harness = createHarness({
      candidate: {
        id: "candidate-1",
        status: "pending",
        mediaPaths: ["candidates/event.jpg"],
        originalText: "Caption",
      },
    });

    await expect(harness.service.publishCandidateToInstagram("candidate-1"))
      .rejects.toThrow("Only approved event candidates can be published.");
    expect(harness.repository.getOrCreateInstagramPublication).not.toHaveBeenCalled();
  });

  it("rejects a candidate without media", async () => {
    const harness = createHarness({
      candidate: {
        id: "candidate-1",
        status: "approved",
        mediaPaths: [],
        originalText: "Caption",
      },
    });

    await expect(harness.service.publishCandidateToInstagram("candidate-1"))
      .rejects.toThrow("Event candidate media is required.");
    expect(harness.repository.getOrCreateInstagramPublication).not.toHaveBeenCalled();
  });

  it("returns an existing published result without calling Instagram again", async () => {
    const harness = createHarness({
      publication: {
        id: "publication-1",
        candidateId: "candidate-1",
        status: "published",
        externalId: "existing-instagram-media",
      },
    });

    await expect(harness.service.publishCandidateToInstagram("candidate-1")).resolves.toEqual({
      publicationId: "publication-1",
      instagramMediaId: "existing-instagram-media",
      alreadyPublished: true,
    });
    expect(harness.repository.claimForPublishing).not.toHaveBeenCalled();
    expect(harness.createSignedUrl).not.toHaveBeenCalled();
    expect(harness.instagramPublisher.publishImage).not.toHaveBeenCalled();
  });

  it("publishes multiple candidate images as an ordered carousel", async () => {
    const harness = createHarness({
      candidate: {
        id: "candidate-1",
        status: "approved",
        mediaPaths: ["candidates/one.jpg", "candidates/two.jpg", "candidates/three.jpg"],
        originalText: "Album caption",
      },
    });
    vi.mocked(harness.createSignedUrl)
      .mockImplementation((path: string) => Promise.resolve(`https://storage.example/${path}`));

    await expect(harness.service.publishCandidateToInstagram("candidate-1")).resolves.toEqual({
      publicationId: "publication-1",
      instagramMediaId: "instagram-carousel-1",
      alreadyPublished: false,
    });
    expect(harness.instagramPublisher.publishCarousel).toHaveBeenCalledWith({
      imageUrls: [
        "https://storage.example/candidates/one.jpg",
        "https://storage.example/candidates/two.jpg",
        "https://storage.example/candidates/three.jpg",
      ],
      caption: "Album caption",
    });
    expect(harness.instagramPublisher.publishImage).not.toHaveBeenCalled();
  });

  it("marks the publication failed when InstagramPublisher fails", async () => {
    const harness = createHarness({ instagramError: new Error("Instagram unavailable") });

    await expect(harness.service.publishCandidateToInstagram("candidate-1"))
      .rejects.toEqual(expect.any(EventPublicationServiceError));
    expect(harness.repository.markFailed).toHaveBeenCalledWith(
      "publication-1",
      "Instagram publication failed.",
    );
    expect(harness.repository.markPublished).not.toHaveBeenCalled();
  });

  it("stores and returns only a safe error without secrets", async () => {
    const sensitiveError = new Error(
      "Bearer real-token https://storage.example/file?token=signed-secret\nstack trace",
    );
    const harness = createHarness({ instagramError: sensitiveError });

    const publication = harness.service.publishCandidateToInstagram("candidate-1");

    await expect(publication).rejects.toThrow("Instagram publication failed.");
    const savedError = vi.mocked(harness.repository.markFailed).mock.calls[0][1];
    expect(savedError).toBe("Instagram publication failed.");
    expect(savedError).not.toContain("real-token");
    expect(savedError).not.toContain("signed-secret");
    expect(savedError).not.toContain("stack trace");
  });
});
