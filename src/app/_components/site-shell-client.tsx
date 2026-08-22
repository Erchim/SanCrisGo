"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteFooterView, SiteHeaderView } from "@/app/_components/site-shell-view";
import { knownLocalizedPaths, publicNavigationState } from "@/lib/locale-navigation";
import type { LocalizedPaths } from "@/lib/locales";

type LookupState = {
  pathname: string;
  paths: LocalizedPaths | null;
};

function useRouteAwareShell(
  initialPathname: string,
  initialPaths: LocalizedPaths | null,
) {
  const pathname = usePathname() || initialPathname;
  const navigation = publicNavigationState(pathname);
  const [lookup, setLookup] = useState<LookupState>({
    pathname: initialPathname,
    paths: initialPaths,
  });
  const knownPaths = knownLocalizedPaths(pathname);
  const localizedPaths = knownPaths === undefined
    ? (lookup.pathname === pathname ? lookup.paths : null)
    : knownPaths;

  useEffect(() => {
    document.documentElement.lang = navigation.locale;
  }, [navigation.locale]);

  useEffect(() => {
    if (knownPaths !== undefined || lookup.pathname === pathname) return;

    const controller = new AbortController();
    const query = new URLSearchParams({ pathname });
    fetch(`/api/localized-paths?${query}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : { paths: null })
      .then((result: { paths?: LocalizedPaths | null }) => {
        setLookup({ pathname, paths: result.paths ?? null });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLookup({ pathname, paths: null });
      });

    return () => controller.abort();
  }, [knownPaths, lookup.pathname, pathname]);

  return { navigation, localizedPaths };
}

export function RouteAwareSiteHeader({
  initialPathname,
  initialPaths,
}: {
  initialPathname: string;
  initialPaths: LocalizedPaths | null;
}) {
  const shell = useRouteAwareShell(initialPathname, initialPaths);
  return <SiteHeaderView navigation={shell.navigation} localizedPaths={shell.localizedPaths} />;
}

export function RouteAwareSiteFooter({
  initialPathname,
}: {
  initialPathname: string;
}) {
  const pathname = usePathname() || initialPathname;
  return <SiteFooterView navigation={publicNavigationState(pathname)} />;
}
