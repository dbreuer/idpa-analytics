import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { DashboardApp } from "@/components/dashboard/dashboard-app";
import { canonicalUrl, disciplinePath, seasonPath } from "@/lib/discipline-paths";
import { getDiscipline, isDisciplineSlug } from "@/lib/disciplines";
import { getAvailableYears, loadDashboardData } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { discipline: string } }) {
  if (!isDisciplineSlug(params.discipline)) return [];
  return getAvailableYears(params.discipline).map((year) => ({ year: String(year) }));
}

async function seasonParams(params: Promise<{ discipline: string; year: string }>) {
  const { discipline: slug, year } = await params;
  if (!isDisciplineSlug(slug) || !/^[1-9]\d{3}$/.test(year)) notFound();
  const definition = getDiscipline(slug);
  if (!definition?.published || !getAvailableYears(slug).includes(Number(year))) notFound();
  return { discipline: definition, year: Number(year) };
}

export async function generateMetadata({ params }: PageProps<"/[discipline]/[year]">): Promise<Metadata> {
  const { discipline, year } = await seasonParams(params);
  return {
    title: `${discipline.name} ${year} · szezoneredmények`,
    description: `A ${year}. évi magyarországi ${discipline.name}-versenyek rangsorai és statisztikái, hivatalos forrásokra visszavezetve.`,
    alternates: { canonical: canonicalUrl(seasonPath(discipline.slug, year)) },
    openGraph: {
      title: `${discipline.name} ${year} · szezonstatisztikák`,
      description: `Versenyzői rangsorok, szezonadatok és hivatalos eredményforrások.`,
    },
  };
}

export default async function SeasonPage({ params }: PageProps<"/[discipline]/[year]">) {
  const { discipline, year } = await seasonParams(params);
  const data = loadDashboardData(discipline.slug, year);

  return (
    <>
      <BreadcrumbJsonLd items={[
        { label: "Lövésznapló statisztika", path: "/" },
        { label: discipline.name, path: disciplinePath(discipline.slug) },
        { label: `${year}. szezon` },
      ]} />
      <DashboardApp
        key={`${discipline.slug}-${year}`}
        discipline={discipline}
        year={year}
        availableYears={getAvailableYears(discipline.slug)}
        competitionsFile={data.competitionsFile}
        resultsFile={data.resultsFile}
        qualityFile={data.qualityFile}
        statistics={data.statistics}
      />
    </>
  );
}
