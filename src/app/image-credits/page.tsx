import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image credits",
  description: "Credits and licenses for documentary images used by SanCrisGo.",
};

export default function ImageCreditsPage() {
  return (
    <article className="credits-page">
      <header className="page-heading">
        <p className="eyebrow">Sources and licenses</p>
        <h1>Image credits</h1>
        <p className="lede">
          Documentary photographs remain credited to their creators. Decorative backgrounds are not presented as real places.
        </p>
      </header>

      <ul className="credits-list">
        <li>
          <h2>San Cristóbal street and mountain view</h2>
          <p>
            Photo by Adam Jones. <a href="https://commons.wikimedia.org/wiki/File:Street_Scene_with_Mountain_Backdrop_-_San_Cristobal_de_las_Casas_-_Chiapas_-_Mexico.jpg">Original source</a>.{" "}
            Licensed under <a href="https://creativecommons.org/licenses/by/2.0">CC BY 2.0</a>. Resized and converted to WebP for SanCrisGo.
          </p>
        </li>
        <li>
          <h2>Ángel Albino Corzo International Airport facade</h2>
          <p>
            Photo by Gobierno de México. <a href="https://commons.wikimedia.org/wiki/File:Nueva_Fachada_del_AIAAC.jpg">Original source</a>.{" "}
            Licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0">CC BY-SA 4.0</a>. Resized and converted to WebP for SanCrisGo.
          </p>
        </li>
        <li>
          <h2>Decorative backgrounds</h2>
          <p>
            The highland mist and stucco arch backgrounds were generated for SanCrisGo with OpenAI image generation. They are decorative, not documentary images of real locations.
          </p>
        </li>
      </ul>
    </article>
  );
}
