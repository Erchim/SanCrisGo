import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  guideLocalizedPaths,
  type Locale,
  type LocalizedPaths,
} from "@/lib/locales";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

export type GuideListItem = {
  id: string;
  translation_group_id: string;
  title: string;
  slug: string;
  summary: string | null;
  category: string;
  language: Locale;
  published_at: string;
  updated_at: string;
  last_verified_at: string | null;
};

export type Guide = GuideListItem & {
  body_markdown: string;
  seo_title: string | null;
  seo_description: string | null;
};

export type GuidePageData = {
  guide: Guide;
  localizedPaths: LocalizedPaths | null;
};

const guideListFields = "id,translation_group_id,title,slug,summary,category,language,published_at,updated_at,last_verified_at";
const guideDetailFields = `${guideListFields},body_markdown,seo_title,seo_description`;

export class PublicGuidesRepository {
  constructor(private readonly client: SupabaseClient = createPublicSupabaseClient()) {}

  async list(locale: Locale, limit?: number): Promise<GuideListItem[]> {
    let query = this.client
      .from("guides")
      .select(guideListFields)
      .eq("publication_status", "published")
      .eq("language", locale)
      .order("published_at", { ascending: false });
    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw new Error(`Unable to load published guides: ${error.message}`);
    return (data ?? []) as GuideListItem[];
  }

  async bySlug(slug: string, locale: Locale): Promise<Guide | null> {
    const { data, error } = await this.client
      .from("guides")
      .select(guideDetailFields)
      .eq("slug", slug)
      .eq("publication_status", "published")
      .eq("language", locale)
      .maybeSingle();
    if (error) throw new Error(`Unable to load published guide: ${error.message}`);
    return data as Guide | null;
  }

  async localizedPaths(translationGroupId: string): Promise<LocalizedPaths | null> {
    const { data, error } = await this.client
      .from("guides")
      .select("slug,language")
      .eq("translation_group_id", translationGroupId)
      .eq("publication_status", "published")
      .in("language", ["en", "es"]);
    if (error) throw new Error(`Unable to load Guide translations: ${error.message}`);

    const translations = (data ?? []) as Array<{ slug: string; language: string }>;
    const english = translations.find((item) => item.language === "en");
    const spanish = translations.find((item) => item.language === "es");
    return english && spanish ? guideLocalizedPaths(english.slug, spanish.slug) : null;
  }

  async pageData(slug: string, locale: Locale): Promise<GuidePageData | null> {
    const guide = await this.bySlug(slug, locale);
    if (!guide) return null;
    return {
      guide,
      localizedPaths: await this.localizedPaths(guide.translation_group_id),
    };
  }
}

export const getPublishedGuides = cache(async (
  locale: Locale = "en",
): Promise<GuideListItem[]> => new PublicGuidesRepository().list(locale));

export const getLatestPublishedGuides = cache(async (
  locale: Locale = "en",
): Promise<GuideListItem[]> => new PublicGuidesRepository().list(locale, 3));

export const getPublishedGuide = cache(async (
  slug: string,
  locale: Locale = "en",
): Promise<Guide | null> => new PublicGuidesRepository().bySlug(slug, locale));

export const getPublishedGuidePageData = cache(async (
  slug: string,
  locale: Locale,
): Promise<GuidePageData | null> => new PublicGuidesRepository().pageData(slug, locale));
