import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { canonicalUrl, disciplinePath, seasonPath } from "@/lib/discipline-paths";
import { disciplineDefinitions, getDiscipline, getDisciplineMark, isDisciplineSlug } from "@/lib/disciplines";
import { getAvailableYears } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return disciplineDefinitions.map((discipline) => ({ discipline: discipline.slug }));
}

async function resolveDiscipline(params: Promise<{ discipline: string }>) {
  const { discipline: slug } = await params;
  if (!isDisciplineSlug(slug)) notFound();
  const discipline = getDiscipline(slug);
  if (!discipline) notFound();
  return discipline;
}

export async function generateMetadata({ params }: PageProps<"/[discipline]">): Promise<Metadata> {
  const discipline = await resolveDiscipline(params);
  const latestYear = getAvailableYears(discipline.slug)[0];
  if (latestYear) {
    const metadata: Metadata = {
      title: discipline.analytics === "idpa"
        ? `${discipline.name} ${latestYear} · szezoneredmények`
        : discipline.analytics === "ipsc"
          ? `${discipline.name} ${latestYear} · divíziórangsorok és statisztikák`
          : `${discipline.name} ${latestYear} · eredménykimutatás`,
      description: discipline.analytics === "idpa"
        ? `A ${latestYear}. évi magyarországi ${discipline.name}-versenyek rangsorai és statisztikái.`
        : discipline.analytics === "ipsc"
          ? `A ${latestYear}. évi IPSC-versenyek divíziónkénti rangsorai és forrásalapú statisztikái.`
          : `A ${latestYear}. évi ${discipline.name}-versenyek forrásból normalizált eredménykimutatása, rangsorolás nélkül.`,
      alternates: { canonical: canonicalUrl(seasonPath(discipline.slug, latestYear)) },
    };
    if (!discipline.published) {
      metadata.robots = { index: false, follow: true, googleBot: { index: false, follow: true } };
    } else if (discipline.analytics === "idpa") {
      metadata.openGraph = {
        title: `${discipline.name} ${latestYear} · szezonstatisztikák`,
        description: `Versenyzői rangsorok, szezonadatok és hivatalos eredményforrások.`,
      };
    } else if (discipline.analytics === "ipsc") {
      metadata.openGraph = {
        title: `${discipline.name} ${latestYear} · divíziórangsorok és statisztikák`,
        description: "IPSC-eredmények, divíziónkénti szezonrangsorok és hivatalos források.",
      };
    }
    return metadata;
  }
  return {
    title: `${discipline.name} · statisztika hamarosan`,
    description: `A ${discipline.name} eredményadatainak és szakágspecifikus statisztikáinak feldolgozása előkészítés alatt áll.`,
    alternates: { canonical: canonicalUrl(disciplinePath(discipline.slug)) },
    robots: {
      index: false,
      follow: true,
      googleBot: { index: false, follow: true },
    },
  };
}

export default async function DisciplinePage({ params }: PageProps<"/[discipline]">) {
  const discipline = await resolveDiscipline(params);
  const mark = getDisciplineMark(discipline.slug);
  const years = getAvailableYears(discipline.slug);
  const latestYear = years[0];
  if (!mark) throw new Error(`Missing official discipline logo metadata for ${discipline.slug}.`);
  if (latestYear) redirect(seasonPath(discipline.slug, latestYear));

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
                A szakág hivatalos eredményformátumának és szabályspecifikus statisztikai mutatóinak feldolgozása előkészítés alatt áll.
              </p>
            </div>
          </div>

          <section className="mt-10 max-w-3xl" aria-labelledby="availability-title">
            <Card>
              <CardTitle id="availability-title" className="font-display text-3xl">
                A statisztikai oldal előkészítés alatt áll
              </CardTitle>
              <CardDescription className="mt-3 text-base leading-7">
                A rangsorok és elemzések csak akkor jelennek meg, ha a hivatalos eredményadatok és a szakágra vonatkozó mérőszámok ellenőrzése befejeződött. Addig itt nem jelenítünk meg ellenőrizetlen eredményeket.
              </CardDescription>
              <a href={mark.href} target="_blank" rel="noreferrer" className="source-link mt-5 inline-flex">
                {discipline.name} – az MDLSZ hivatalos szakági oldala
              </a>
            </Card>
          </section>
        </div>
      </main>
      <SiteFooter disciplineSlug={discipline.slug} />
    </>
  );
}
