export type SharePayload = {
  title: string;
  url: string;
};

export type ShareAdapters = {
  share?: (payload: SharePayload) => Promise<void>;
  copy: (value: string) => Promise<void>;
};

export type ShareResult = "shared" | "copied" | "cancelled";

export async function shareOrCopy(
  payload: SharePayload,
  adapters: ShareAdapters,
): Promise<ShareResult> {
  if (adapters.share) {
    try {
      await adapters.share(payload);
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }

  await adapters.copy(payload.url);
  return "copied";
}
