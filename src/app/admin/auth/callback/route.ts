import { NextResponse } from "next/server";
import { adminRecoveryPath } from "@/lib/admin-password-recovery";
import { getAbsoluteUrl } from "@/lib/site-url";
import { createAuthenticatedSupabaseClient } from "@/lib/supabase/auth-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const flowId = requestUrl.searchParams.get("sb_flow_id");
  const next = adminRecoveryPath(requestUrl.searchParams.get("next"));
  const resetUrl = getAbsoluteUrl(next);
  const failureUrl = getAbsoluteUrl("/admin/login?error=recovery");

  if (!resetUrl || !failureUrl) {
    return NextResponse.json({ error: "Password recovery is not configured." }, { status: 503 });
  }

  if (code) {
    try {
      const client = await createAuthenticatedSupabaseClient();
      const { error } = await client.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );
      if (!error) {
        return NextResponse.redirect(resetUrl, {
          headers: { "Cache-Control": "no-store" },
        });
      }
    } catch {
      // The same generic failure page covers expired, invalid, and interrupted recovery flows.
    }
  }

  return NextResponse.redirect(failureUrl, {
    headers: { "Cache-Control": "no-store" },
  });
}
