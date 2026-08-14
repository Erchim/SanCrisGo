import "server-only";

function normalizedSiteUrl(): URL | undefined {
  const configuredUrl = process.env.SITE_URL?.trim();
  if (!configuredUrl) return undefined;

  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    if (url.hostname === "vercel.app" || url.hostname.endsWith(".vercel.app")) return undefined;

    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return undefined;
  }
}

export function getSiteUrl(): URL | undefined {
  return normalizedSiteUrl();
}

export function getAbsoluteUrl(pathname: string): string | undefined {
  const siteUrl = getSiteUrl();
  if (!siteUrl) return undefined;

  const base = siteUrl.toString().replace(/\/$/, "");
  const path = pathname === "/" ? "" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  return `${base}${path || "/"}`;
}
