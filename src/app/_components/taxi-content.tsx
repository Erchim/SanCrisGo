import Link from "next/link";
import type { Locale } from "@/lib/locales";

const copy = {
  en: {
    message: "Hi Mario, I found you through SanCrisGo. I need a taxi from [pickup] to [destination].",
    transport: "Local transport",
    title: "Taxi in San Cristóbal de las Casas",
    lede: "Need a ride? You can contact Mario directly on WhatsApp to ask about a taxi in San Cristóbal or a trip beyond the city.",
    contactEyebrow: "Direct contact",
    contactTitle: "Message Mario on WhatsApp",
    contactText: "The message includes placeholders for your pickup and destination, so you can edit the details before sending it.",
    cta: "Message Mario on WhatsApp ↗",
    useful: "Useful for",
    tripsTitle: "Trips in and around San Cristóbal",
    uses: [
      "Rides within San Cristóbal de las Casas",
      "Airport transfers",
      "Private trips or day trips to nearby destinations",
    ],
    before: "Before you go",
    confirmTitle: "Confirm availability and price directly",
    confirmText: "Transport details can vary by route and time, so confirm availability and the price with Mario before you travel.",
  },
  es: {
    message: "Hola Mario, encontré tu contacto en SanCrisGo. Necesito un taxi de [origen] a [destino].",
    transport: "Transporte local",
    title: "Taxi en San Cristóbal de las Casas",
    lede: "¿Necesitas transporte? Puedes contactar directamente a Mario por WhatsApp para consultar un viaje dentro o fuera de San Cristóbal.",
    contactEyebrow: "Contacto directo",
    contactTitle: "Escríbele a Mario por WhatsApp",
    contactText: "El mensaje incluye espacios para indicar tu origen y destino, y puedes editarlo antes de enviarlo.",
    cta: "Escribir a Mario por WhatsApp ↗",
    useful: "Útil para",
    tripsTitle: "Viajes en San Cristóbal y sus alrededores",
    uses: [
      "Traslados dentro de San Cristóbal de las Casas",
      "Traslados al aeropuerto",
      "Viajes privados o excursiones de un día a destinos cercanos",
    ],
    before: "Antes de salir",
    confirmTitle: "Confirma directamente la disponibilidad y el precio",
    confirmText: "Los detalles del transporte pueden variar según la ruta y el horario. Confirma la disponibilidad y el precio con Mario antes de viajar.",
  },
} as const;

export function TaxiContent({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const whatsappUrl = `https://wa.me/5219671156950?text=${encodeURIComponent(text.message)}`;

  return (
    <article className="taxi-page">
      <header className="page-heading taxi-heading">
        <p className="eyebrow">{text.transport}</p>
        <h1>{text.title}</h1>
        <p className="lede">{text.lede}</p>
      </header>

      <section className="taxi-contact" aria-labelledby={`taxi-contact-heading-${locale}`}>
        <div>
          <p className="eyebrow">{text.contactEyebrow}</p>
          <h2 id={`taxi-contact-heading-${locale}`}>{text.contactTitle}</h2>
          <p>{text.contactText}</p>
        </div>
        <a className="taxi-whatsapp-link" href={whatsappUrl} rel="noopener noreferrer" target="_blank">
          {text.cta}
        </a>
      </section>

      <section className="taxi-section" aria-labelledby={`taxi-use-heading-${locale}`}>
        <p className="eyebrow">{text.useful}</p>
        <h2 id={`taxi-use-heading-${locale}`}>{text.tripsTitle}</h2>
        <ul className="taxi-use-list">
          {text.uses.map((use) => <li key={use}>{use}</li>)}
        </ul>
      </section>

      <aside className="taxi-note" aria-labelledby={`taxi-note-heading-${locale}`}>
        <p className="eyebrow">{text.before}</p>
        <h2 id={`taxi-note-heading-${locale}`}>{text.confirmTitle}</h2>
        <p>{text.confirmText}</p>
      </aside>

      {locale === "en" && (
        <p className="taxi-related-link">
          <Link href="/guides/getting-around-san-cristobal-de-las-casas">
            See our guide to getting around San Cristóbal
          </Link>
        </p>
      )}
    </article>
  );
}
