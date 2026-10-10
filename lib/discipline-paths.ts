import type { DisciplineSlug } from "@/lib/disciplines";

export const siteOrigin = "https://statisztika.lovesznaplo.hu";

export function platformPath() {
  return "/";
}

export function disciplinePath(discipline: DisciplineSlug) {
  return `/${discipline}`;
}

export function seasonPath(discipline: DisciplineSlug, year: number, hash = "") {
  return `/${discipline}/${year}${hash}`;
}

export function methodologyPath(discipline: DisciplineSlug) {
  return `/${discipline}/methodology`;
}

export function canonicalUrl(path: string) {
  const url = new URL(path, `${siteOrigin}/`);
  return url.pathname === "/" ? siteOrigin : url.toString();
}
