import type { Metadata } from "next";
import Link from "next/link";
import { getAbsoluteUrl } from "@/lib/site-url";

const canonical = getAbsoluteUrl("/");

export const metadata: Metadata = {
  ...(canonical && { alternates: { canonical } }),
  openGraph: {
    title: "SanCrisGo",
    description: "Practical local guides to San Cristóbal de las Casas, Chiapas.",
    ...(canonical && { url: canonical }),
  },
};

export default function Home() {
  return (
    <section>
      <h1>SanCrisGo</h1>
      <p className="lede">A local guide to San Cristóbal de las Casas.</p>
      <p><Link href="/guides">Browse guides</Link></p>
    </section>
  );
}
