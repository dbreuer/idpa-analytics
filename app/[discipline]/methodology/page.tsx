import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { canonicalUrl, disciplinePath, methodologyPath } from "@/lib/discipline-paths";
import { getDiscipline, isDisciplineSlug } from "@/lib/disciplines";

const sections = [
  {
    title: "Összesített teljesítménypontszám",
    description:
      "A konfigurálható pontszámítási modell a helyezésekért járó pontokat, a versenyrészvételt, a győzelmi és dobogós bónuszokat, valamint a kiegyensúlyozottsági pontszámot összesíti. A részvételi pontszám felső korlátja megakadályozza, hogy önmagában az indulások száma határozza meg a rangsort.",
  },
  {
    title: "Sebességmutatók",
    description:
      "Az időeredmények akkor jelennek meg, ha rendelkezésre állnak. Különböző versenyek időeredményei közvetlenül nem hasonlíthatók össze. A normalizált sebességmutató az adott verseny legjobb érvényes idejét használja viszonyítási alapként.",
  },
  {
    title: "Egyesületi rangsorok",
    description:
      "Az egyesületi összpontszám (Club Power) az öt legeredményesebb tag pontszámának összege. A tagok átlagpontszáma (Club Strength) az egyesület versenyzőinek átlagos teljesítményét mutatja. Így az egyesület létszáma önmagában nem határozza meg a rangsorát.",
  },
  {
    title: "Fejlődési mutató",
    description:
      "A fejlődési mutató a versenyző szezonjának első és második felében elért átlagos helyezést hasonlítja össze. A kiemelés az átlagos helyezés legnagyobb javulását mutatja a legalább három rögzített helyezéssel rendelkező versenyzők között.",
  },
  {
    title: "Forrásadatok és átláthatóság",
    description:
      "Az adatforrás az MDLSZ hivatalos versenynaptára és a versenyek hivatalos PDF-eredményjegyzékei. Az eredeti és a normalizált értékeket egyaránt megőrizzük. A hiányzó értékeket „Nincs adat” jelölés mutatja; a feldolgozási hibák az adatminőségi szakaszban jelennek meg.",
  },
  {
    title: "A rangsorok számítási forrása",
    description:
      "A megjelenített rangsorokat és grafikonokat az alkalmazás TypeScript-alapú IDPA-analitikája számítja a normalizált szezoneredményekből. A pipeline külön analyticsVersion-jelöléssel ellátott statistics.json állományt is készít; ennek értékeit a felület nem tekinti a megjelenített pontszámokkal azonos számításnak.",
  },
];

async function resolveDiscipline(params: Promise<{ discipline: string }>) {
  const { discipline: slug } = await params;
  if (!isDisciplineSlug(slug)) notFound();
  const discipline = getDiscipline(slug);
  if (!discipline?.published || discipline.analytics !== "idpa") notFound();
  return discipline;
}

export async function generateMetadata({ params }: PageProps<"/[discipline]/methodology">): Promise<Metadata> {
  const discipline = await resolveDiscipline(params);
  return {
    title: `${discipline.name} · módszertan`,
    description: `A ${discipline.name} rangsorainak, teljesítménymutatóinak és adatfeldolgozásának módszertana.`,
    alternates: { canonical: canonicalUrl(methodologyPath(discipline.slug)) },
  };
}

export default async function MethodologyPage({ params }: PageProps<"/[discipline]/methodology">) {
  const discipline = await resolveDiscipline(params);
  return (
    <>
      <BreadcrumbJsonLd items={[
        { label: "Lövésznapló statisztika", path: "/" },
        { label: discipline.name, path: disciplinePath(discipline.slug) },
        { label: "Módszertan" },
      ]} />
      <header className="methodology-nav">
        <div className="methodology-nav-inner">
          <Link href={disciplinePath(discipline.slug)} className="brand-mark" aria-label={`${discipline.name} kezdőlap`}>
            <span className="brand-mark-top">HERO OF</span>
            <span className="brand-mark-bottom">{discipline.name}<span className="brand-period">.</span></span>
          </Link>
          <Link href={disciplinePath(discipline.slug)} className="source-link">Vissza az {discipline.name}-szezonokhoz</Link>
        </div>
      </header>
      <main className="methodology-main">
        <h1 className="font-display text-5xl font-extrabold leading-[0.95] md:text-6xl">
          Statisztikai és pontszámítási módszertan
        </h1>
        <p className="mt-4 max-w-[68ch] text-base leading-7 text-[var(--ink-muted)]">
          A főbb mutatók számítását dokumentáljuk, hogy a szezoneredmények visszakövethetők legyenek a hivatalos forrásokhoz.
        </p>
        <div className="mt-10 space-y-7">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardTitle className="font-display text-2xl font-bold">{section.title}</CardTitle>
              <CardDescription className="mt-2 max-w-[68ch] text-base leading-7">
                {section.description}
              </CardDescription>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter disciplineSlug={discipline.slug} />
    </>
  );
}
