import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/format-date";
import type { GuideListItem } from "@/lib/guides";
import { guidePath, type Locale } from "@/lib/locales";
import { getGuideCardImage } from "@/lib/site-images";

const copy = {
  en: { fallback: "Open the guide for practical local information.", verified: "Last verified" },
  es: { fallback: "Abre la guía para consultar información local práctica.", verified: "Última verificación" },
} as const;

export function GuideCard({
  guide,
  locale,
  headingLevel = "h2",
}: {
  guide: GuideListItem;
  locale: Locale;
  headingLevel?: "h2" | "h3";
}) {
  const image = getGuideCardImage(guide.slug);
  const href = guidePath(guide.slug, locale);
  const text = copy[locale];
  const Heading = headingLevel;

  return (
    <li className="guide-card">
      <article>
        {image && (
          <Link aria-hidden="true" className="guide-card-media" href={href} tabIndex={-1}>
            <Image
              alt={image.alt[locale]}
              aria-hidden={image.decorative ? "true" : undefined}
              height={image.height}
              loading="lazy"
              sizes="(max-width: 44rem) 100vw, (max-width: 72rem) 50vw, 33vw"
              src={image.src}
              width={image.width}
            />
          </Link>
        )}
        <div className="guide-card-content">
          <p className="guide-category">{guide.category}</p>
          <Heading><Link href={href}>{guide.title}</Link></Heading>
          <p className="guide-summary">{guide.summary ?? text.fallback}</p>
          {guide.last_verified_at && (
            <p className="guide-meta">
              {text.verified}{" "}
              <time dateTime={guide.last_verified_at}>
                {formatDate(guide.last_verified_at, locale)}
              </time>
            </p>
          )}
        </div>
      </article>
    </li>
  );
}
