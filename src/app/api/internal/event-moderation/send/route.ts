import { NextResponse } from "next/server";
import { secretsMatch } from "@/lib/server-secret";
import { sendCandidateForModeration } from "@/lib/telegram/moderation";

export async function POST(request: Request) {
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
    await sendCandidateForModeration(candidateId);
    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: "Candidate could not be sent for moderation." }, { status: 422 });
  }
}
