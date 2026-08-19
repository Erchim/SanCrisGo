import { NextResponse } from "next/server";
import { secretsMatch } from "@/lib/server-secret";
import { WhatsAppEventIngester, type WhatsAppEventInput } from "@/lib/events/whatsapp-ingestion";
import { sendCandidateForModeration } from "@/lib/telegram/moderation";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
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

    const image = form.get("image");
    if (!(image instanceof File)) return invalid();
    const extension = IMAGE_EXTENSIONS[image.type];
    if (!extension) return NextResponse.json({ error: "Unsupported image type." }, { status: 400 });
    if (image.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Image is too large." }, { status: 413 });

    const value = (name: string) => {
      const entry = form.get(name);
      return typeof entry === "string" ? entry : "";
    };
    const sourceMessageId = value("sourceMessageId").trim();
    const sourceGroupId = value("sourceGroupId").trim();
    const caption = value("caption").trim();
    const receivedAt = value("receivedAt").trim();
    if (!sourceMessageId || !sourceGroupId || !caption || !receivedAt || Number.isNaN(Date.parse(receivedAt))) return invalid();

    const input: WhatsAppEventInput = {
      image, extension, sourceMessageId, sourceGroupId, caption,
      sourceGroupName: value("sourceGroupName"),
      sourceSenderId: value("sourceSenderId"),
      sourceSenderName: value("sourceSenderName"),
      receivedAt: new Date(receivedAt).toISOString(),
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
