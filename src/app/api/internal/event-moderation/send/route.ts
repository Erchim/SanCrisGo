import { NextResponse } from "next/server";
import { secretsMatch } from "@/lib/server-secret";
import {
  moderationSendErrorCode,
  sendCandidateForModeration,
  type ModerationSendErrorCode,
} from "@/lib/telegram/moderation";

type SendCandidate = (candidateId: string) => Promise<unknown>;

export function createSendCandidateForModerationHandler(sendCandidate: SendCandidate) {
  return async (request: Request) => {
    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (!secretsMatch(token, process.env.INTERNAL_EVENT_API_SECRET)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
    const candidateId = typeof body === "object" && body !== null && "candidateId" in body
      ? (body as { candidateId?: unknown }).candidateId : null;
    if (typeof candidateId !== "string" || !candidateId.trim()) {
      return NextResponse.json({ error: "candidateId is required." }, { status: 400 });
    }
    try {
      await sendCandidate(candidateId);
      return NextResponse.json({ sent: true });
    } catch (error) {
      const code: ModerationSendErrorCode = moderationSendErrorCode(error);
      console.error(`[event-moderation-send] ${code}`);
      return NextResponse.json({ error: code }, { status: 422 });
    }
  };
}

export const POST = createSendCandidateForModerationHandler(sendCandidateForModeration);
