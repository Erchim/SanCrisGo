export type SiteImageAsset = {
  src: string;
  width: number;
  height: number;
  alt: { en: string; es: string };
  decorative?: boolean;
};

export const homeHeroImage: SiteImageAsset = {
  src: "/images/site/san-cristobal-street-mountain.webp",
  width: 1600,
  height: 1200,
  alt: {
    en: "Colorful tiled roofs and colonial facades in San Cristóbal de las Casas with a forested mountain behind them.",
    es: "Tejados coloridos y fachadas coloniales de San Cristóbal de las Casas con una montaña boscosa al fondo.",
  },
};

export const airportFacadeImage: SiteImageAsset = {
  src: "/images/site/tgz-airport-facade.webp",
  width: 1280,
  height: 853,
  alt: {
    en: "The glass airside facade of Ángel Albino Corzo International Airport under a blue sky.",
    es: "La fachada acristalada del lado aire del Aeropuerto Internacional Ángel Albino Corzo bajo un cielo azul.",
  },
};

export const stuccoArchesBackground: SiteImageAsset = {
  src: "/images/site/stucco-arches-background.webp",
  width: 1717,
  height: 916,
  alt: { en: "", es: "" },
  decorative: true,
};

export const highlandMistBackground: SiteImageAsset = {
  src: "/images/site/highland-mist-background.webp",
  width: 1774,
  height: 887,
  alt: { en: "", es: "" },
  decorative: true,
};

const guideImages: Record<string, SiteImageAsset> = {
  "tuxtla-gutierrez-airport-to-san-cristobal-de-las-casas": airportFacadeImage,
  "san-cristobal-de-las-casas-to-tuxtla-gutierrez-airport": airportFacadeImage,
  "tuxtla-gutierrez-to-san-cristobal-de-las-casas": highlandMistBackground,
  "de-san-cristobal-de-las-casas-al-aeropuerto-de-tuxtla-gutierrez": airportFacadeImage,
  "del-aeropuerto-de-tuxtla-gutierrez-a-san-cristobal-de-las-casas": airportFacadeImage,
  "de-tuxtla-gutierrez-a-san-cristobal-de-las-casas": highlandMistBackground,
};

export function getGuideCardImage(slug: string): SiteImageAsset | null {
  return guideImages[slug] ?? null;
}
