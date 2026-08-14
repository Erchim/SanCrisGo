import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SanCrisGo", template: "%s | SanCrisGo" },
  description: "A local guide to San Cristóbal de las Casas.",
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
              <Link href="/guides">Guides</Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
