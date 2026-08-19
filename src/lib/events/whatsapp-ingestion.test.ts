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
      images: [{
        image: new File(["image"], "event.jpg", { type: "image/jpeg" }),
        extension: "jpg",
        sourceMessageId: "message-1",
        receivedAt: "2026-08-19T12:00:00.000Z",
      }],
      sourceGroupId: "group-1",
      sourceGroupName: "Group",
      sourceSenderId: "sender-1",
      sourceSenderName: "Sender",
      caption: "Caption",
    });

    expect(candidateInsert?.collection_started_at).toEqual(expect.any(String));
    expect(candidateInsert?.collection_closed_at).toBe(candidateInsert?.collection_started_at);
  });

  it("uploads and stores album images in source order", async () => {
    let candidateInsert: Record<string, unknown> | undefined;
    let messageInsert: Array<Record<string, unknown>> | undefined;
    const candidateTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn((row: Record<string, unknown>) => {
        candidateInsert = row;
        return Promise.resolve({ error: null });
      }),
    };
    const messageTable = {
      insert: vi.fn((rows: Array<Record<string, unknown>>) => {
        messageInsert = rows;
        return Promise.resolve({ error: null });
      }),
    };
    const bucket = {
      upload: vi.fn().mockResolvedValue({ error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    };
    const client = {
      storage: { from: vi.fn().mockReturnValue(bucket) },
      from: vi.fn((table: string) => table === "event_candidates" ? candidateTable : messageTable),
    } as unknown as SupabaseClient;

    await new WhatsAppEventIngester(client).ingest({
      images: [
        { image: new File(["one"], "one.jpg", { type: "image/jpeg" }), extension: "jpg", sourceMessageId: "message-1", receivedAt: "2026-08-19T12:00:00.000Z" },
        { image: new File(["two"], "two.png", { type: "image/png" }), extension: "png", sourceMessageId: "message-2", receivedAt: "2026-08-19T12:00:05.000Z" },
      ],
      sourceGroupId: "group-1",
      sourceGroupName: "Group",
      sourceSenderId: "sender-1",
      sourceSenderName: "Sender",
      caption: "Album caption",
    });

    const firstPath = String(messageInsert?.[0].media_path);
    const secondPath = String(messageInsert?.[1].media_path);
    expect(firstPath).toMatch(/\/000\.jpg$/);
    expect(secondPath).toMatch(/\/001\.png$/);
    expect(candidateInsert?.media_path).toBe(firstPath);
    expect(messageInsert).toEqual([
      expect.objectContaining({ source_message_id: "message-1", text: "Album caption", sequence: 0 }),
      expect.objectContaining({ source_message_id: "message-2", text: "", sequence: 1 }),
    ]);
    expect(bucket.upload).toHaveBeenCalledTimes(2);
  });
});
