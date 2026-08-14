import "server-only";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

export type GuideListItem = {
  id: string; title: string; slug: string; summary: string | null; category: string;
  language: string; published_at: string; updated_at: string; last_verified_at: string | null;
};

export type Guide = GuideListItem & {
  body_markdown: string; seo_title: string | null; seo_description: string | null;
};

export async function getPublishedGuides(): Promise<GuideListItem[]> {
  const { data, error } = await createPublicSupabaseClient()
    .from("guides")
    .select("id,title,slug,summary,category,language,published_at,updated_at,last_verified_at")
    .eq("publication_status", "published")
    .order("published_at", { ascending: false });
  if (error) throw new Error(`Unable to load published guides: ${error.message}`);
  return data;
}

export async function getPublishedGuide(slug: string): Promise<Guide | null> {
  const { data, error } = await createPublicSupabaseClient()
    .from("guides")
    .select("id,title,slug,summary,category,language,published_at,updated_at,last_verified_at,body_markdown,seo_title,seo_description")
    .eq("slug", slug)
    .eq("publication_status", "published")
    .maybeSingle();
  if (error) throw new Error(`Unable to load published guide: ${error.message}`);
  return data;
}
