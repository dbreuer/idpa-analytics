import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { DashboardApp } from "@/components/dashboard/dashboard-app";
import { DescriptiveDisciplineReport } from "@/components/dashboard/descriptive-discipline-report";
import { IpscDashboard } from "@/components/dashboard/ipsc-dashboard";
import { GyorskombinaltDashboard } from "@/components/dashboard/gyorskombinalt-dashboard";
import { ImssuDashboard } from "@/components/dashboard/imssu-dashboard";
import { SteelChallengeDashboard } from "@/components/dashboard/steel-challenge-dashboard";
import { canonicalUrl, disciplinePath, seasonPath } from "@/lib/discipline-paths";
import { getDiscipline, isDisciplineSlug } from "@/lib/disciplines";
import { getAvailableYears, getDisciplinesWithData, loadDashboardData } from "@/lib/data";
import { buildImssuStatistics } from "@/lib/imssu-statistics";
import { buildIpscStatistics } from "@/lib/ipsc-statistics";
import { buildSteelChallengeStatistics } from "@/lib/steel-challenge-statistics";

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

function seasonCopy(analytics: string, name: string, year: number) {
  switch (analytics) {
    case "idpa":
      return {
        title: `${name} ${year} · szezoneredmények`,
        description: `A ${year}. évi magyarországi ${name}-versenyek rangsorai és statisztikái, hivatalos forrásokra visszavezetve.`,
      };
    case "ipsc":
      return {
        title: `${name} ${year} · divíziórangsorok és statisztikák`,
        description: `A ${year}. évi IPSC-versenyek divíziónként elkülönített rangsorai, szezonstatisztikái és hivatalos eredményforrásai.`,
        openGraph: "IPSC-eredmények, divíziónkénti szezonrangsorok és hivatalos források.",
      };
    case "imssu":
      return {
        title: `${name} ${year} · fémsziluett divíziórangsorok`,
        description: `A ${year}. évi IMSSU fémsziluett-versenyek divíziónkénti, versenyen belüli találatszámokból számított rangsorai, statisztikái és hivatalos eredményforrásai.`,
        openGraph: "IMSSU fémsziluett-eredmények, divíziórangsorok, országos bajnoki győztesek és hivatalos források.",
      };
    case "gyorskombinalt":
      return {
        title: `${name} ${year} · részvételi statisztikák és eredmények`,
        description: `A ${year}. évi Gyorskombinált és Precíziós szakági versenyek részvételi statisztikái, versenyzői előzményei és hivatalos eredményjegyzékei, számított szezonrangsor nélkül.`,
      };
    case "steel-challenge":
      return {
        title: `${name} ${year} · divíziórangsorok és szezonstatisztikák`,
        description: `A ${year}. évi Steel Challenge versenyek divíziónkénti rangsorai, szezonstatisztikái és hivatalos eredményforrásai.`,
        openGraph: "Steel Challenge eredmények, divíziórangsorok, szezonkiemelések és hivatalos források.",
      };
    default:
      return {
        title: `${name} ${year} · eredménykimutatás`,
        description: `A ${year}. évi ${name}-versenyek forrásból normalizált eredménykimutatása; pontozott rangsor nem készül.`,
      };
  }
}

export async function generateMetadata({ params }: PageProps<"/[discipline]/[year]">): Promise<Metadata> {
  const { discipline, year } = await seasonParams(params);
  const copy = seasonCopy(discipline.analytics, discipline.name, year);
  const metadata: Metadata = {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: canonicalUrl(seasonPath(discipline.slug, year)) },
  };
  if (!discipline.published) {
    metadata.robots = { index: false, follow: true, googleBot: { index: false, follow: true } };
  }
  if ("openGraph" in copy) {
    metadata.openGraph = { title: copy.title, description: copy.openGraph };
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

  if (discipline.analytics === "ipsc") {
    return (
      <>
        {breadcrumb}
        <IpscDashboard
          year={year}
          availableYears={getAvailableYears(discipline.slug)}
          competitionsFile={data.competitionsFile}
          resultsFile={data.resultsFile}
          qualityFile={data.qualityFile}
          statistics={buildIpscStatistics(data.competitionsFile.competitions, data.resultsFile.results)}
        />
      </>
    );
  }

  if (discipline.analytics === "imssu") {
    return (
      <>
        {breadcrumb}
        <ImssuDashboard
          key={`${discipline.slug}-${year}`}
          year={year}
          availableYears={getAvailableYears(discipline.slug)}
          competitionsFile={data.competitionsFile}
          resultsFile={data.resultsFile}
          qualityFile={data.qualityFile}
          statistics={buildImssuStatistics(data.competitionsFile.competitions, data.resultsFile.results)}
        />
      </>
    );
  }

  if (discipline.analytics === "gyorskombinalt") {
    return (
      <>
        {breadcrumb}
        <GyorskombinaltDashboard
          key={`${discipline.slug}-${year}`}
          year={year}
          availableYears={getAvailableYears(discipline.slug)}
          competitionsFile={data.competitionsFile}
          resultsFile={data.resultsFile}
          qualityFile={data.qualityFile}
        />
      </>
    );
  }

  if (discipline.analytics === "steel-challenge") {
    return (
      <>
        {breadcrumb}
        <SteelChallengeDashboard
          key={`${discipline.slug}-${year}`}
          year={year}
          availableYears={getAvailableYears(discipline.slug)}
          competitionsFile={data.competitionsFile}
          qualityFile={data.qualityFile}
          statistics={buildSteelChallengeStatistics(data.competitionsFile.competitions, data.resultsFile.results)}
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
