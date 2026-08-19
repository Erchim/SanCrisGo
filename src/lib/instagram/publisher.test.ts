import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { InstagramPublisher, InstagramPublisherError } from "./publisher";

const config = {
  accessToken: "test-token",
  igUserId: "17841400000000000",
  pollIntervalMs: 10,
  timeoutMs: 100,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("InstagramPublisher", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates, waits for, and publishes an image container", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: "creation-1" }))
      .mockResolvedValueOnce(jsonResponse({ status_code: "IN_PROGRESS" }))
      .mockResolvedValueOnce(jsonResponse({ status_code: "FINISHED" }))
      .mockResolvedValueOnce(jsonResponse({ id: "instagram-media-1" }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const publisher = new InstagramPublisher(config, { fetch: fetchMock, sleep });

    await expect(publisher.publishImage({
      imageUrl: "https://signed.example/event.jpg",
      caption: "Event caption",
    })).resolves.toBe("instagram-media-1");

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://graph.instagram.com/v26.0/17841400000000000/media",
    );
    const containerBody = fetchMock.mock.calls[0][1].body;
    expect(containerBody).toBeInstanceOf(URLSearchParams);
    expect((containerBody as URLSearchParams).has("location_id")).toBe(false);
    expect(fetchMock.mock.calls[3][0]).toBe(
      "https://graph.instagram.com/v26.0/17841400000000000/media_publish",
    );
    for (const [url, init] of fetchMock.mock.calls) {
      expect(String(url)).not.toContain("access_token");
      expect(new Headers(init.headers).get("Authorization")).toBe("Bearer test-token");

      if (init.body instanceof URLSearchParams) {
        expect(init.body.has("access_token")).toBe(false);
      }
    }
    expect(sleep).toHaveBeenCalledWith(10);
  });

  it("includes a configured location ID", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: "creation-1" }))
      .mockResolvedValueOnce(jsonResponse({ status_code: "FINISHED" }))
      .mockResolvedValueOnce(jsonResponse({ id: "instagram-media-1" }));
    const publisher = new InstagramPublisher({
      ...config,
      locationId: "123456789",
    }, { fetch: fetchMock });

    await publisher.publishImage({
      imageUrl: "https://signed.example/event.jpg",
      caption: "Event caption",
    });

    const containerBody = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(containerBody.get("location_id")).toBe("123456789");
  });

  it("omits the optional caption field when it is empty", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: "creation-1" }))
      .mockResolvedValueOnce(jsonResponse({ status_code: "FINISHED" }))
      .mockResolvedValueOnce(jsonResponse({ id: "instagram-media-1" }));
    const publisher = new InstagramPublisher(config, { fetch: fetchMock });

    await publisher.publishImage({
      imageUrl: "https://signed.example/event.jpg",
      caption: "",
    });

    const containerBody = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(containerBody.has("caption")).toBe(false);
  });

  it("creates image items and publishes an ordered carousel", async () => {
    const childIds = ["child-1", "child-2", "child-3"];
    let nextChild = 0;
    const fetchMock = vi.fn((url: string | URL | Request, init?: RequestInit) => {
      const stringUrl = String(url);
      if (stringUrl.endsWith("/17841400000000000/media") && init?.method === "POST") {
        const body = init.body as URLSearchParams;
        if (body.get("is_carousel_item") === "true") {
          return Promise.resolve(jsonResponse({ id: childIds[nextChild++] }));
        }
        expect(body.get("media_type")).toBe("CAROUSEL");
        expect(body.get("children")).toBe(childIds.join(","));
        expect(body.get("caption")).toBe("Album caption");
        return Promise.resolve(jsonResponse({ id: "carousel-1" }));
      }
      if (stringUrl.includes("/child-") || stringUrl.includes("/carousel-1")) {
        return Promise.resolve(jsonResponse({ status_code: "FINISHED" }));
      }
      if (stringUrl.endsWith("/17841400000000000/media_publish")) {
        return Promise.resolve(jsonResponse({ id: "instagram-carousel-1" }));
      }
      return Promise.resolve(jsonResponse({}, 404));
    });
    const publisher = new InstagramPublisher(config, { fetch: fetchMock as typeof fetch });

    await expect(publisher.publishCarousel({
      imageUrls: [
        "https://signed.example/one.jpg",
        "https://signed.example/two.jpg",
        "https://signed.example/three.jpg",
      ],
      caption: "Album caption",
    })).resolves.toBe("instagram-carousel-1");

    const childBodies = fetchMock.mock.calls
      .map((call) => call[1]?.body)
      .filter((body): body is URLSearchParams => body instanceof URLSearchParams)
      .filter((body) => body.get("is_carousel_item") === "true");
    expect(childBodies.map((body) => body.get("image_url"))).toEqual([
      "https://signed.example/one.jpg",
      "https://signed.example/two.jpg",
      "https://signed.example/three.jpg",
    ]);
  });

  it.each([1, 11])("rejects a carousel with %i images", async (count) => {
    const publisher = new InstagramPublisher(config, { fetch: vi.fn() as typeof fetch });
    await expect(publisher.publishCarousel({
      imageUrls: Array.from({ length: count }, (_, index) => `https://signed.example/${index}.jpg`),
      caption: "Caption",
    })).rejects.toThrow("Instagram carousels require between 2 and 10 images.");
  });

  it("rejects a non-numeric location ID", () => {
    expect(() => new InstagramPublisher({
      ...config,
      locationId: "San Cristobal",
    })).toThrow("Instagram location ID must be numeric.");
  });

  it("fails when the container reports an error", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: "creation-1" }))
      .mockResolvedValueOnce(jsonResponse({
        status_code: "ERROR",
        status: "Image download failed",
      }));
    const publisher = new InstagramPublisher(config, { fetch: fetchMock });

    await expect(publisher.publishImage({
      imageUrl: "https://signed.example/event.jpg",
      caption: "Event caption",
    })).rejects.toThrow("Instagram container entered ERROR status: Image download failed.");
  });

  it("times out while waiting for the container", async () => {
    let time = 0;
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ id: "creation-1" }))
      .mockImplementation(() => Promise.resolve(
        jsonResponse({ status_code: "IN_PROGRESS" }),
      ));
    const publisher = new InstagramPublisher(config, {
      fetch: fetchMock,
      now: () => time,
      sleep: async (milliseconds) => {
        time += milliseconds;
      },
    });

    await expect(publisher.publishImage({
      imageUrl: "https://signed.example/event.jpg",
      caption: "Event caption",
    })).rejects.toThrow("Instagram container did not finish within 100ms.");
  });

  it("surfaces Graph API errors without including the token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      error: { message: "Invalid image URL", type: "OAuthException", code: 100 },
    }, 400));
    const publisher = new InstagramPublisher(config, { fetch: fetchMock });

    const publication = publisher.publishImage({
      imageUrl: "https://signed.example/event.jpg",
      caption: "Event caption",
    });

    await expect(publication).rejects.toEqual(expect.any(InstagramPublisherError));
    await expect(publication).rejects.toThrow("Instagram API error (code 100): Invalid image URL.");
    await expect(publication).rejects.not.toThrow("test-token");
  });
});
