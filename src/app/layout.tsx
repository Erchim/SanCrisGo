import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteFooter, SiteHeader } from "@/app/_components/site-shell";
import { localeFromPathname } from "@/lib/locales";
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get("x-sancrisgo-pathname") ?? "/";
  const locale = localeFromPathname(pathname);

  return (
    <html lang={locale}>
      <body>
        <SiteHeader pathname={pathname} />
        <main>{children}</main>
        <SiteFooter pathname={pathname} />
      </body>
    </html>
  );
}
