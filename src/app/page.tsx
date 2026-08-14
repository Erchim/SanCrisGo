import Link from "next/link";

export default function Home() {
  return (
    <section>
      <h1>SanCrisGo</h1>
      <p className="lede">A local guide to San Cristóbal de las Casas.</p>
      <p><Link href="/guides">Browse guides</Link></p>
    </section>
  );
}
