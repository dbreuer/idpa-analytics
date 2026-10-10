import type { MetadataRoute } from "next";

import { canonicalUrl, disciplinePath, methodologyPath, seasonPath } from "@/lib/discipline-paths";
import { getPublishedDisciplines } from "@/lib/data";
import { getAvailableYears, loadDashboardData } from "@/lib/data";

function modifiedDate(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const disciplines = getPublishedDisciplines();
  const entries: MetadataRoute.Sitemap = [
    { url: canonicalUrl("/"), changeFrequency: "monthly", priority: 1 },
  ];

  for (const discipline of disciplines) {
    const years = getAvailableYears(discipline.slug);
    const latest = loadDashboardData(discipline.slug, years[0]);
    const lastModified = modifiedDate(latest.competitionsFile.generatedAt);
    entries.push(
      {
        url: canonicalUrl(disciplinePath(discipline.slug)),
        lastModified,
        changeFrequency: "monthly",
        priority: 0.9,
      },
      {
        url: canonicalUrl(methodologyPath(discipline.slug)),
        changeFrequency: "yearly",
        priority: 0.5,
      },
    );
    for (const year of years) {
      const data = year === years[0] ? latest : loadDashboardData(discipline.slug, year);
      entries.push({
        url: canonicalUrl(seasonPath(discipline.slug, year)),
        lastModified: modifiedDate(data.competitionsFile.generatedAt),
        changeFrequency: "monthly",
        priority: year === years[0] ? 0.8 : 0.6,
      });
    }
  }

  return entries;
}
