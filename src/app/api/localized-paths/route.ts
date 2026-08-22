import { NextRequest, NextResponse } from "next/server";
import { resolveLocalizedPaths } from "@/lib/locale-navigation-server";

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname");
  if (!pathname || !pathname.startsWith("/") || pathname.length > 300) {
    return NextResponse.json({ paths: null }, { status: 400 });
  }

  const paths = await resolveLocalizedPaths(pathname);
  return NextResponse.json(
    { paths },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
