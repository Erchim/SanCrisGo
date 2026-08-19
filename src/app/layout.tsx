import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const description = "Practical local guides to San Cristóbal de las Casas, Chiapas.";
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
              <Link href="/">Home</Link>
              <Link href="/events">Events</Link>
              <Link href="/guides">Guides</Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
