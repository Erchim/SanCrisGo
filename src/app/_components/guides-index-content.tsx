import Link from "next/link";
import { GuideCard } from "@/app/_components/guide-card";
import { getPublishedGuides } from "@/lib/guides";
import { homePath, type Locale } from "@/lib/locales";

const copy = {
  en: {
    eyebrow: "Explore San Cristóbal",
    title: "Guides",
    lede: "Practical, carefully researched guides for making the most of San Cristóbal de las Casas.",
    empty: "No guides have been published yet. Please check back soon.",
    home: "Home",
  },
  es: {
    eyebrow: "Explora San Cristóbal",
    title: "Guías",
    lede: "Guías prácticas y cuidadosamente investigadas para aprovechar tu estancia en San Cristóbal de las Casas.",
    empty: "Todavía no hay guías publicadas. Vuelve pronto.",
    home: "Inicio",
  },
} as const;

export async function GuidesIndexContent({ locale }: { locale: Locale }) {
  const guides = await getPublishedGuides(locale);
  const text = copy[locale];

  return (
    <section className="guides-index">
      <nav className="content-breadcrumbs" aria-label={locale === "es" ? "Migas de pan" : "Breadcrumb"}>
        <ol>
          <li><Link href={homePath(locale)}>{text.home}</Link></li>
          <li aria-current="page">{text.title}</li>
        </ol>
      </nav>
      <header className="page-heading">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p className="lede">{text.lede}</p>
      </header>
      {guides.length === 0 ? (
        <p>{text.empty}</p>
      ) : (
        <ul className="guide-list">
          {guides.map((guide) => (
            <GuideCard guide={guide} key={guide.id} locale={locale} />
          ))}
        </ul>
      )}
    </section>
  );
}
