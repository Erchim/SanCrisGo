import type { Metadata } from "next";
import Link from "next/link";
import { getAbsoluteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const canonical = getAbsoluteUrl("/taxi");
const whatsappMessage = "Hi Mario, I found you through SanCrisGo. I need a taxi from [pickup] to [destination].";
const whatsappUrl = `https://wa.me/5219671156950?text=${encodeURIComponent(whatsappMessage)}`;

export const metadata: Metadata = {
  title: "Taxi in San Cristóbal de las Casas",
  description: "Contact a local taxi driver in San Cristóbal de las Casas through WhatsApp for rides, airport transfers, and private trips.",
  ...(canonical && { alternates: { canonical } }),
  openGraph: {
    title: "Taxi in San Cristóbal de las Casas",
    description: "Contact a local taxi driver in San Cristóbal de las Casas through WhatsApp.",
    ...(canonical && { url: canonical }),
  },
};

export default function TaxiPage() {
  return (
    <article className="taxi-page">
      <header className="page-heading taxi-heading">
        <p className="eyebrow">Local transport</p>
        <h1>Taxi in San Cristóbal de las Casas</h1>
        <p className="lede">
          Need a ride? You can contact Mario directly on WhatsApp to ask about a taxi in San Cristóbal or a trip beyond the city.
        </p>
      </header>

      <section className="taxi-contact" aria-labelledby="taxi-contact-heading">
        <div>
          <p className="eyebrow">Direct contact</p>
          <h2 id="taxi-contact-heading">Message Mario on WhatsApp</h2>
          <p>
            The message includes placeholders for your pickup and destination, so you can edit the details before sending it.
          </p>
        </div>
        <a className="taxi-whatsapp-link" href={whatsappUrl} rel="noopener noreferrer" target="_blank">
          Message Mario on WhatsApp ↗
        </a>
      </section>

      <section className="taxi-section" aria-labelledby="taxi-use-heading">
        <p className="eyebrow">Useful for</p>
        <h2 id="taxi-use-heading">Trips in and around San Cristóbal</h2>
        <ul className="taxi-use-list">
          <li>Rides within San Cristóbal de las Casas</li>
          <li>Airport transfers</li>
          <li>Private trips or day trips to nearby destinations</li>
        </ul>
      </section>

      <aside className="taxi-note" aria-labelledby="taxi-note-heading">
        <p className="eyebrow">Before you go</p>
        <h2 id="taxi-note-heading">Confirm availability and price directly</h2>
        <p>
          Transport details can vary by route and time, so confirm availability and the price with Mario before you travel.
        </p>
      </aside>

      <p className="taxi-related-link">
        <Link href="/guides/getting-around-san-cristobal-de-las-casas">
          See our guide to getting around San Cristóbal
        </Link>
      </p>
    </article>
  );
}
