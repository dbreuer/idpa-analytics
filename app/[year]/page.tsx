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
    title: `MDLSZ IDPA ${year} Season Analytics`,
    description: `Interactive analytics for official Hungarian MDLSZ IDPA ${year} competition results.`,
    alternates: { canonical: `/${year}` },
  };
}

export default async function SeasonPage({ params }: PageProps<"/[year]">) {
  const year = await seasonYear(params);
  const data = loadDashboardData(year);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617_0%,#020617_35%,#111827_100%)] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <DashboardApp
          key={year}
          year={year}
          availableYears={getAvailableYears()}
          competitionsFile={data.competitionsFile}
          resultsFile={data.resultsFile}
          qualityFile={data.qualityFile}
          statistics={data.statistics}
        />
      </div>
    </main>
  );
}
