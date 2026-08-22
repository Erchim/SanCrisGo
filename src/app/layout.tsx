import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const description = "Practical local guides and events in San Cristóbal de las Casas, Chiapas.";
const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: "SanCrisGo", template: "%s | SanCrisGo" },
  description,
  applicationName: "SanCrisGo",
  openGraph: {
    type: "website",
    siteName: "SanCrisGo",
    title: "SanCrisGo",
    description,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav aria-label="Primary navigation">
            <Link className="site-name" href="/">SanCrisGo</Link>
            <div className="site-links">
              <Link href="/events">Events</Link>
              <Link href="/taxi">Taxi</Link>
              <Link href="/guides">Guides</Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div>
            <p><strong className="footer-name">SanCrisGo</strong><span>Practical local information for San Cristóbal de las Casas.</span></p>
            <nav aria-label="Footer navigation">
              <Link href="/events">Events</Link>
              <Link href="/guides">Guides</Link>
              <Link href="/image-credits">Image credits</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
