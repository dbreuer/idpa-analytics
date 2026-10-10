import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { canonicalUrl, disciplinePath, methodologyPath, seasonPath } from "@/lib/discipline-paths";
import { getDiscipline, getDisciplineMark, isDisciplineSlug } from "@/lib/disciplines";
import { getAvailableYears, loadDashboardData } from "@/lib/data";

async function resolveDiscipline(params: Promise<{ discipline: string }>) {
  const { discipline: slug } = await params;
  if (!isDisciplineSlug(slug)) notFound();
  const discipline = getDiscipline(slug);
  if (!discipline?.published || !getAvailableYears(slug).length) notFound();
  return discipline;
}

export async function generateMetadata({ params }: PageProps<"/[discipline]">): Promise<Metadata> {
  const discipline = await resolveDiscipline(params);
  return {
    title: `${discipline.name} eredmények és ranglisták`,
    description: `A magyarországi ${discipline.name}-versenyek szezoneredményei és statisztikái az MDLSZ hivatalos forrásadatai alapján.`,
    alternates: { canonical: canonicalUrl(disciplinePath(discipline.slug)) },
    openGraph: { title: `${discipline.name} · Lövésznapló statisztika`, description: `Szezonrangsorok és versenystatisztikák: ${discipline.name}.` },
  };
}

export default async function DisciplinePage({ params }: PageProps<"/[discipline]">) {
  const discipline = await resolveDiscipline(params);
  const mark = getDisciplineMark(discipline.slug);
  const years = getAvailableYears(discipline.slug);
  const latestYear = years[0];
  const latest = loadDashboardData(discipline.slug, latestYear);
  if (!mark) throw new Error(`Missing official discipline logo metadata for ${discipline.slug}.`);

  return (
    <>
      <BreadcrumbJsonLd items={[
        { label: "Lövésznapló statisztika", path: "/" },
        { label: discipline.name },
      ]} />
      <main className="empty-main min-h-screen">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <Link href="/" className="source-link">Lövésznapló statisztika</Link>
          <div className="mt-8 flex flex-col gap-8 border-b border-[var(--rule)] pb-10 sm:flex-row sm:items-center">
            <Image src={mark.logo} width={mark.width} height={mark.height} alt="" className="h-auto w-40 object-contain" />
            <div>
              <h1 className="font-display text-6xl font-extrabold leading-[0.95] md:text-8xl">{discipline.name}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--ink-muted)]">
                A magyarországi {discipline.name}-versenyek szezoneredményei, versenyzői rangsorai és elemzései. Az adatok az MDLSZ hivatalos versenynaptárából és eredményjegyzékeiből származnak.
              </p>
            </div>
          </div>

          <section className="mt-10" aria-labelledby="seasons-title">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="seasons-title" className="section-title">Elérhető szezonok</h2>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">{years.length} teljes, publikált szezon</p>
              </div>
              <Link href={seasonPath(discipline.slug, latestYear)} className="source-link">
                Legfrissebb szezon: {latestYear}
              </Link>
            </div>
            <ul className="mt-5 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
              {years.map((year) => {
                const data = year === latestYear ? latest : loadDashboardData(discipline.slug, year);
                return (
                  <li key={year}>
                    <Link href={seasonPath(discipline.slug, year)} className="block">
                      <Card className="transition-colors hover:border-[var(--ink-muted)]">
                        <CardTitle className="font-display text-4xl">{year}. szezon</CardTitle>
                        <CardDescription className="mt-2">
                          {data.statistics.totalCompetitions} verseny · {data.statistics.uniqueCompetitors} versenyző · {data.statistics.totalEntries} eredmény
                        </CardDescription>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="mt-8">
            <Link href={methodologyPath(discipline.slug)} className="source-link">A pontszámítás és az adatfeldolgozás módszertana</Link>
          </p>
        </div>
      </main>
      <SiteFooter disciplineSlug={discipline.slug} />
    </>
  );
}
