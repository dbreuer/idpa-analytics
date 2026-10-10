import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { DashboardApp } from "@/components/dashboard/dashboard-app";
import { DescriptiveDisciplineReport } from "@/components/dashboard/descriptive-discipline-report";
import { canonicalUrl, disciplinePath, seasonPath } from "@/lib/discipline-paths";
import { getDiscipline, isDisciplineSlug } from "@/lib/disciplines";
import { getAvailableYears, getDisciplinesWithData, loadDashboardData } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDisciplinesWithData().flatMap((discipline) =>
    getAvailableYears(discipline.slug).map((year) => ({
      discipline: discipline.slug,
      year: String(year),
    })),
  );
}

async function seasonParams(params: Promise<{ discipline: string; year: string }>) {
  const { discipline: slug, year } = await params;
  if (!isDisciplineSlug(slug) || !/^[1-9]\d{3}$/.test(year)) notFound();
  const definition = getDiscipline(slug);
  if (!definition || !getAvailableYears(slug).includes(Number(year))) notFound();
  return { discipline: definition, year: Number(year) };
}

export async function generateMetadata({ params }: PageProps<"/[discipline]/[year]">): Promise<Metadata> {
  const { discipline, year } = await seasonParams(params);
  const metadata: Metadata = {
    title: discipline.analytics === "idpa"
      ? `${discipline.name} ${year} · szezoneredmények`
      : `${discipline.name} ${year} · eredménykimutatás`,
    description: discipline.analytics === "idpa"
      ? `A ${year}. évi magyarországi ${discipline.name}-versenyek rangsorai és statisztikái, hivatalos forrásokra visszavezetve.`
      : `A ${year}. évi ${discipline.name}-versenyek forrásból normalizált eredménykimutatása; pontozott rangsor nem készül.`,
    alternates: { canonical: canonicalUrl(seasonPath(discipline.slug, year)) },
  };
  if (discipline.analytics !== "idpa") {
    metadata.robots = { index: false, follow: true, googleBot: { index: false, follow: true } };
  }
  return metadata;
}

export default async function SeasonPage({ params }: PageProps<"/[discipline]/[year]">) {
  const { discipline, year } = await seasonParams(params);
  const data = loadDashboardData(discipline.slug, year);
  const breadcrumb = (
    <BreadcrumbJsonLd items={[
      { label: "Lövésznapló statisztika", path: "/" },
      { label: discipline.name, path: disciplinePath(discipline.slug) },
      { label: `${year}. szezon` },
    ]} />
  );

  if (discipline.analytics === "idpa") {
    if (!data.statistics) {
      throw new Error(`The IDPA analytics summary is missing for ${year}.`);
    }
    return (
      <>
        {breadcrumb}
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

  return (
    <>
      {breadcrumb}
      <DescriptiveDisciplineReport
        discipline={discipline}
        year={year}
        availableYears={getAvailableYears(discipline.slug)}
        competitionsFile={data.competitionsFile}
        resultsFile={data.resultsFile}
        qualityFile={data.qualityFile}
      />
    </>
  );
}
