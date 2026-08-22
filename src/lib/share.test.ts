import { describe, expect, it, vi } from "vitest";
import { shareOrCopy } from "@/lib/share";

describe("public page sharing", () => {
  const payload = { title: "A useful page", url: "https://www.sancrisgo.com/events/music" };

  it("uses native sharing when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const copy = vi.fn().mockResolvedValue(undefined);
    await expect(shareOrCopy(payload, { share, copy })).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith(payload);
    expect(copy).not.toHaveBeenCalled();
  });

  it("copies the canonical URL when native sharing is unavailable", async () => {
    const copy = vi.fn().mockResolvedValue(undefined);
    await expect(shareOrCopy(payload, { copy })).resolves.toBe("copied");
    expect(copy).toHaveBeenCalledWith(payload.url);
  });

  it("falls back to copying after a native share error", async () => {
    const copy = vi.fn().mockResolvedValue(undefined);
    await expect(shareOrCopy(payload, {
      share: vi.fn().mockRejectedValue(new Error("Unavailable")),
      copy,
    })).resolves.toBe("copied");
  });
});
