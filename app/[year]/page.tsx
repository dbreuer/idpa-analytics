import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DashboardApp } from "@/components/dashboard/dashboard-app";
import { getAvailableYears, loadDashboardData } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAvailableYears().map((year) => ({ year: String(year) }));
}

async function seasonYear(params: Promise<{ year: string }>) {
  const { year } = await params;
  if (!/^[1-9]\d{3}$/.test(year) || !getAvailableYears().includes(Number(year))) notFound();
  return Number(year);
}

export async function generateMetadata({ params }: PageProps<"/[year]">): Promise<Metadata> {
  const year = await seasonYear(params);
  return {
    title: `Hero of IDPA ${year} | Szezonstatisztikák`,
    description: `A ${year}. évi magyarországi IDPA-versenyek eredményei, rangsorai és statisztikái az MDLSZ hivatalos versenyadatai alapján.`,
    alternates: { canonical: `/${year}` },
  };
}

export default async function SeasonPage({ params }: PageProps<"/[year]">) {
  const year = await seasonYear(params);
  const data = loadDashboardData(year);

  return (
    <DashboardApp
      key={year}
      year={year}
      availableYears={getAvailableYears()}
      competitionsFile={data.competitionsFile}
      resultsFile={data.resultsFile}
      qualityFile={data.qualityFile}
      statistics={data.statistics}
    />
  );
}
