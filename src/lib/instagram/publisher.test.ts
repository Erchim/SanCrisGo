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
