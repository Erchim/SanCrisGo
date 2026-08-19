import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
vi.mock("server-only", () => ({}));

import { WhatsAppEventIngester } from "./whatsapp-ingestion";

describe("WhatsAppEventIngester", () => {
  it("uses one identical timestamp for the closed one-message collection", async () => {
    let candidateInsert: Record<string, unknown> | undefined;
    const candidateTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn((row: Record<string, unknown>) => {
        candidateInsert = row;
        return Promise.resolve({ error: null });
      }),
    };
    const messageTable = { insert: vi.fn().mockResolvedValue({ error: null }) };
    const bucket = {
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    };
    const client = {
      storage: { from: vi.fn().mockReturnValue(bucket) },
      from: vi.fn((table: string) => table === "event_candidates" ? candidateTable : messageTable),
    } as unknown as SupabaseClient;

    await new WhatsAppEventIngester(client).ingest({
      image: new File(["image"], "event.jpg", { type: "image/jpeg" }),
      extension: "jpg",
      sourceGroupId: "group-1",
      sourceGroupName: "Group",
      sourceSenderId: "sender-1",
      sourceSenderName: "Sender",
      sourceMessageId: "message-1",
      caption: "Caption",
      receivedAt: "2026-08-19T12:00:00.000Z",
    });

    expect(candidateInsert?.collection_started_at).toEqual(expect.any(String));
    expect(candidateInsert?.collection_closed_at).toBe(candidateInsert?.collection_started_at);
  });
});
