import Link from "next/link";
import {
  CONTRIBUTION_PHONE_DISPLAY,
  contributionWhatsAppUrl,
  type ContributionKind,
} from "@/lib/contributions";
import { homePath, type Locale } from "@/lib/locales";

const copy = {
  en: {
    home: "Home",
    breadcrumb: "Breadcrumb",
    eyebrow: "Help keep local information useful",
    title: "Contribute to SanCrisGo",
    lede: "SanCrisGo is building a current local information hub for San Cristóbal de las Casas. Local businesses, organizers, artists, teachers, photographers, projects and residents can help from the beginning.",
    how: "How you can contribute",
    place: {
      title: "Add or suggest a Place",
      text: "Send a café, restaurant, bar, hotel or hostel, cultural space, attraction, local project, or another useful business or location.",
      details: "Useful details include its name, what it is, location or Google Maps link, phone or WhatsApp, opening hours, official links, a short description, and photos.",
      cta: "Send Place information",
      kind: "place" as ContributionKind,
    },
    event: {
      title: "Send an Event",
      text: "Send a one-time or recurring Event, workshop, concert, class, market, or cultural activity.",
      details: "Include the date, time, venue, address, price, organizer contact, and the original flyer or source when possible.",
      cta: "Send an Event",
      kind: "event" as ContributionKind,
    },
    update: {
      title: "Suggest an update or correction",
      text: "Tell us about wrong opening hours, an outdated phone number, an incorrect address, an Event change, a temporary closure, or a broken link.",
      details: "On an Event, Guide, or Place page you can also use “Suggest an update” so the exact page is included automatically.",
      cta: "Suggest an update",
      kind: "update" as ContributionKind,
    },
    service: {
      title: "Local people and services",
      text: "Musicians, DJs, photographers, teachers, guides, organizers, and local service providers can send their information.",
      details: "We will review it and evaluate how it fits the growing SanCrisGo platform. This does not create a public profile automatically.",
      cta: "Introduce yourself or your service",
      kind: "service" as ContributionKind,
    },
    whatsapp: "Contributions currently arrive through a moderated WhatsApp workflow. SanCrisGo staff review information before it becomes canonical public content.",
    phone: "WhatsApp",
    photosTitle: "About photos",
    photos: "Useful real photos are welcome. Please only send photos you own or have permission to share with SanCrisGo.",
  },
  es: {
    home: "Inicio",
    breadcrumb: "Migas de pan",
    eyebrow: "Ayúdanos a mantener información local útil",
    title: "Participa en SanCrisGo",
    lede: "SanCrisGo está creando un espacio de información local actualizada sobre San Cristóbal de las Casas. Negocios, organizadores, artistas, docentes, fotógrafos, proyectos y residentes pueden participar desde el inicio.",
    how: "Cómo puedes participar",
    place: {
      title: "Agrega o sugiere un lugar",
      text: "Envíanos un café, restaurante, bar, hotel u hostal, espacio cultural, atracción, proyecto local u otro negocio o lugar útil.",
      details: "La información útil incluye nombre, qué es, ubicación o enlace de Google Maps, teléfono o WhatsApp, horarios, enlaces oficiales, una descripción breve y fotos.",
      cta: "Enviar información de un lugar",
      kind: "place" as ContributionKind,
    },
    event: {
      title: "Envía un evento",
      text: "Envíanos un evento único o recurrente, taller, concierto, clase, mercado o actividad cultural.",
      details: "Incluye fecha, hora, sede, dirección, precio, contacto de la organización y, cuando sea posible, el cartel o la fuente original.",
      cta: "Enviar un evento",
      kind: "event" as ContributionKind,
    },
    update: {
      title: "Sugiere una actualización o corrección",
      text: "Avísanos sobre horarios incorrectos, un teléfono desactualizado, una dirección equivocada, un cambio de evento, un cierre temporal o un enlace roto.",
      details: "En las páginas de eventos, guías y lugares también puedes usar “Sugerir una actualización” para incluir automáticamente la página exacta.",
      cta: "Sugerir una actualización",
      kind: "update" as ContributionKind,
    },
    service: {
      title: "Personas y servicios locales",
      text: "Músicos, DJs, fotógrafos, docentes, guías, organizadores y proveedores de servicios locales pueden enviarnos su información.",
      details: "La revisaremos para evaluar cómo puede integrarse a SanCrisGo mientras la plataforma crece. Esto no crea automáticamente un perfil público.",
      cta: "Presentarte o presentar tu servicio",
      kind: "service" as ContributionKind,
    },
    whatsapp: "Por ahora recibimos las contribuciones mediante un flujo moderado por WhatsApp. El equipo de SanCrisGo revisa la información antes de convertirla en contenido público canónico.",
    phone: "WhatsApp",
    photosTitle: "Sobre las fotos",
    photos: "Puedes enviar fotos reales y útiles. Envía únicamente fotos tuyas o que tengas permiso de compartir con SanCrisGo.",
  },
} as const;

export function ContributionContent({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const actions = [text.place, text.event, text.update, text.service];

  return (
    <article className="contribution-page">
      <nav className="content-breadcrumbs" aria-label={text.breadcrumb}>
        <ol>
          <li><Link href={homePath(locale)}>{text.home}</Link></li>
          <li aria-current="page">{text.title}</li>
        </ol>
      </nav>

      <header className="page-heading contribution-heading">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1>{text.title}</h1>
        <p className="lede">{text.lede}</p>
      </header>

      <section aria-labelledby={`contribution-options-${locale}`}>
        <h2 id={`contribution-options-${locale}`}>{text.how}</h2>
        <div className="contribution-grid">
          {actions.map((action) => (
            <article className="contribution-card" key={action.kind}>
              <h3>{action.title}</h3>
              <p>{action.text}</p>
              <p className="contribution-details">{action.details}</p>
              <a
                className="contribution-whatsapp-link"
                href={contributionWhatsAppUrl(action.kind, locale)}
                rel="noopener noreferrer"
              >
                {action.cta} ↗
              </a>
            </article>
          ))}
        </div>
      </section>

      <aside className="contribution-note">
        <p>{text.whatsapp}</p>
        <p><strong>{text.phone}:</strong> {CONTRIBUTION_PHONE_DISPLAY}</p>
      </aside>

      <aside className="contribution-photo-note" aria-labelledby={`contribution-photos-${locale}`}>
        <h2 id={`contribution-photos-${locale}`}>{text.photosTitle}</h2>
        <p>{text.photos}</p>
      </aside>
    </article>
  );
}
