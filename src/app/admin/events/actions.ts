"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import {
  EventWebsiteAdminError,
  EventWebsiteAdminService,
  parseEventDraftForm,
} from "@/lib/events/website-admin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function candidateIdFrom(formData: FormData): string {
  const value = formData.get("candidate_id");
  const candidateId = typeof value === "string" ? value.trim() : "";
  if (!UUID_PATTERN.test(candidateId)) throw new EventWebsiteAdminError("Candidate ID is invalid.");
  return candidateId;
}

function errorMessage(error: unknown): string {
  return error instanceof EventWebsiteAdminError
    ? error.message
    : "Unexpected website event error. Please try again.";
}

export async function saveEventDraft(formData: FormData) {
  const admin = await requireAdmin();
  let candidateId = "";
  let slug = "";
  let failure = "";

  try {
    candidateId = candidateIdFrom(formData);
    const input = parseEventDraftForm(formData, candidateId);
    const result = await new EventWebsiteAdminService().saveDraft(candidateId, admin.id, input);
    slug = result.slug;
  } catch (error) {
    failure = errorMessage(error);
  }

  if (failure) {
    const target = candidateId ? `/admin/events/${candidateId}` : "/admin/events";
    redirect(`${target}?error=${encodeURIComponent(failure)}`);
  }

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${candidateId}`);
  if (slug) revalidatePath(`/events/${slug}`);
  redirect(`/admin/events/${candidateId}?status=saved`);
}

export async function publishWebsiteEvent(formData: FormData) {
  const admin = await requireAdmin();
  let candidateId = "";
  let slug = "";
  let failure = "";

  try {
    candidateId = candidateIdFrom(formData);
    const input = parseEventDraftForm(formData, candidateId);
    const result = await new EventWebsiteAdminService().publish(candidateId, admin.id, input);
    slug = result.slug;
  } catch (error) {
    failure = errorMessage(error);
  }

  if (failure) {
    const target = candidateId ? `/admin/events/${candidateId}` : "/admin/events";
    redirect(`${target}?error=${encodeURIComponent(failure)}`);
  }

  revalidatePath("/events");
  revalidatePath(`/events/${slug}`);
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${candidateId}`);
  redirect("/admin/events?filter=published&status=published");
}

export async function skipWebsiteCandidate(formData: FormData) {
  const admin = await requireAdmin();
  let failure = "";

  try {
    const candidateId = candidateIdFrom(formData);
    await new EventWebsiteAdminService().skip(candidateId, admin.id);
  } catch (error) {
    failure = errorMessage(error);
  }

  if (failure) redirect(`/admin/events?error=${encodeURIComponent(failure)}`);
  revalidatePath("/admin/events");
  redirect("/admin/events?status=skipped");
}
