import { NextResponse, type NextRequest } from "next/server";

import { siteOrigin } from "@/lib/discipline-paths";

const legacyHosts = new Set(["hero-of-idpa.hu", "www.hero-of-idpa.hu"]);

export function proxy(request: NextRequest) {
  const host = request.nextUrl.hostname.toLowerCase();
  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";
  const isLegacyHost = legacyHosts.has(host);
  let destinationPath: string | undefined;

  if (isLegacyHost) {
    if (pathname === "/") destinationPath = "/idpa";
    else if (pathname === "/methodology") destinationPath = "/idpa/methodology";
    else if (/^\/[1-9]\d{3}$/.test(pathname)) destinationPath = `/idpa${pathname}`;
  } else if (/^\/[1-9]\d{3}$/.test(pathname)) {
    destinationPath = `/idpa${pathname}`;
  } else if (pathname === "/methodology") {
    destinationPath = "/idpa/methodology";
  }

  if (!destinationPath) return NextResponse.next();

  const target = new URL(destinationPath, siteOrigin);
  target.search = request.nextUrl.search;
  return NextResponse.redirect(target, 308);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
