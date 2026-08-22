import { NextResponse } from "next/server";
import {
  buildEventCalendar,
  eventCanonicalPath,
} from "@/lib/events/calendar";
import { getPublishedEvent } from "@/lib/events/public-events";
import { relevantEventOccurrence } from "@/lib/events/recurrence";
import type { Locale } from "@/lib/locales";
import { getAbsoluteUrl } from "@/lib/site-url";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const locale: Locale = url.searchParams.get("locale") === "es" ? "es" : "en";
  const requestedOccurrence = url.searchParams.get("occurrence") ?? undefined;
  const event = await getPublishedEvent(slug, locale);
  if (!event) return new NextResponse("Event not found", { status: 404 });

  const occurrence = relevantEventOccurrence(event, new Date(), requestedOccurrence);
  if (!occurrence) return new NextResponse("No upcoming occurrence", { status: 404 });

  const canonicalUrl = getAbsoluteUrl(eventCanonicalPath(event, locale));
  if (!canonicalUrl) return new NextResponse("Site URL is not configured", { status: 503 });

  const calendar = buildEventCalendar(occurrence, locale, canonicalUrl);
  return new NextResponse(calendar.content, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${calendar.filename}"`,
      "Content-Type": "text/calendar; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
