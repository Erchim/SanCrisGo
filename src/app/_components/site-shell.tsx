import { Suspense } from "react";
import {
  RouteAwareSiteFooter,
  RouteAwareSiteHeader,
} from "@/app/_components/site-shell-client";
import { SiteFooterView, SiteHeaderView } from "@/app/_components/site-shell-view";
import { publicNavigationState } from "@/lib/locale-navigation";
import { resolveLocalizedPaths } from "@/lib/locale-navigation-server";

export async function SiteHeader({ pathname }: { pathname: string }) {
  const localizedPaths = await resolveLocalizedPaths(pathname);
  const navigation = publicNavigationState(pathname);

  return (
    <Suspense fallback={<SiteHeaderView navigation={navigation} localizedPaths={localizedPaths} />}>
      <RouteAwareSiteHeader initialPathname={pathname} initialPaths={localizedPaths} />
    </Suspense>
  );
}

export function SiteFooter({ pathname }: { pathname: string }) {
  const navigation = publicNavigationState(pathname);

  return (
    <Suspense fallback={<SiteFooterView navigation={navigation} />}>
      <RouteAwareSiteFooter initialPathname={pathname} />
    </Suspense>
  );
}
