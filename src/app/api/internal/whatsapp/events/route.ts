import { NextResponse } from "next/server";
import { secretsMatch } from "@/lib/server-secret";
import { WhatsAppEventIngester, type WhatsAppEventInput } from "@/lib/events/whatsapp-ingestion";
import { sendCandidateForModeration } from "@/lib/telegram/moderation";

const MAX_IMAGES = 10;
// Vercel Functions reject request bodies above 4.5 MB. Leave room for the
// multipart envelope and metadata so callers receive a deterministic error.
const MAX_TOTAL_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type Ingester = Pick<WhatsAppEventIngester,
  "ingest" | "claimModerationDispatch" | "markModerationSent" | "releaseModerationDispatch">;

export function createWhatsAppEventsHandler(
  ingester: Ingester,
  dispatch: (candidateId: string) => Promise<unknown>,
) {
  return async (request: Request) => {
    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (!secretsMatch(token, process.env.WHATSAPP_INGEST_SECRET)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let form: FormData;
    try { form = await request.formData(); }
    catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

    const images = form.getAll("image");
    if (images.length < 1 || images.length > MAX_IMAGES || images.some((image) => !(image instanceof File))) {
      return invalid();
    }

    const imageFiles = images as File[];
    const extensions = imageFiles.map((image) => IMAGE_EXTENSIONS[image.type]);
    if (extensions.some((extension) => !extension)) {
      return NextResponse.json({ error: "Unsupported image type." }, { status: 400 });
    }
    const totalImageBytes = imageFiles.reduce((total, image) => total + image.size, 0);
    if (totalImageBytes > MAX_TOTAL_IMAGE_BYTES) {
      return NextResponse.json({ error: "Images are too large." }, { status: 413 });
    }

    const value = (name: string) => {
      const entry = form.get(name);
      return typeof entry === "string" ? entry : "";
    };
    const sourceMessageIds = form.getAll("sourceMessageId")
      .map((entry) => typeof entry === "string" ? entry.trim() : "");
    const sourceGroupId = value("sourceGroupId").trim();
    const caption = value("caption").trim();
    const receivedAts = form.getAll("receivedAt")
      .map((entry) => typeof entry === "string" ? entry.trim() : "");
    if (
      !sourceGroupId ||
      sourceMessageIds.length !== imageFiles.length ||
      receivedAts.length !== imageFiles.length ||
      sourceMessageIds.some((id) => !id) ||
      new Set(sourceMessageIds).size !== sourceMessageIds.length ||
      receivedAts.some((receivedAt) => !receivedAt || Number.isNaN(Date.parse(receivedAt)))
    ) return invalid();

    const input: WhatsAppEventInput = {
      images: imageFiles.map((image, index) => ({
        image,
        extension: extensions[index]!,
        sourceMessageId: sourceMessageIds[index],
        receivedAt: new Date(receivedAts[index]).toISOString(),
      })),
      sourceGroupId, caption,
      sourceGroupName: value("sourceGroupName"),
      sourceSenderId: value("sourceSenderId"),
      sourceSenderName: value("sourceSenderName"),
    };

    try {
      const result = await ingester.ingest(input);
      const claimed = await ingester.claimModerationDispatch(result.candidateId);
      if (claimed) {
        try {
          await dispatch(result.candidateId);
        } catch {
          try { await ingester.releaseModerationDispatch(result.candidateId); }
          catch { console.error("[whatsapp-ingest] moderation_release_failed"); }
          console.error("[whatsapp-ingest] moderation_dispatch_failed");
          return NextResponse.json({ error: "Moderation dispatch failed." }, { status: 502 });
        }
        try {
          await ingester.markModerationSent(result.candidateId);
        } catch {
          // Keep the claim: Telegram succeeded, so automatically retrying would
          // risk creating a duplicate moderation card.
          console.error("[whatsapp-ingest] moderation_finalize_failed");
          return NextResponse.json({ error: "Moderation dispatch state is uncertain." }, { status: 502 });
        }
      }
      return NextResponse.json({ ok: true, candidateId: result.candidateId });
    } catch {
      console.error("[whatsapp-ingest] ingestion_failed");
      return NextResponse.json({ error: "Unable to ingest event." }, { status: 500 });
    }
  };
}

function invalid() { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

export const POST = createWhatsAppEventsHandler(new WhatsAppEventIngester(), sendCandidateForModeration);
