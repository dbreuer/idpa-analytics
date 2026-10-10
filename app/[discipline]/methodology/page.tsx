import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { canonicalUrl, disciplinePath, methodologyPath } from "@/lib/discipline-paths";
import { getDiscipline, isDisciplineSlug } from "@/lib/disciplines";
import { getPublishedDisciplines } from "@/lib/data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedDisciplines().map((discipline) => ({ discipline: discipline.slug }));
}

const idpaSections = [
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

const ipscSections = [
  {
    title: "A versenymező értékelhető helyezése",
    description:
      "A rangsorba csak a versenynaptárban Level 1, Level 2 vagy Level 3 szinttel jelölt versenyek kerülhetnek. A licencvizsgák és a más szinttel jelölt események forrásadatai megmaradnak, de nem számítanak bele.",
  },
  {
    title: "Helyezési percentilis",
    description:
      "Minden versenyen és divízióban az indulók száma n. Egy r helyezés percentilise 100 × (n − r) / (n − 1), 0 és 100 közé korlátozva; az első helyezés 100%, az utolsó 0%. Holtversenyben az elfoglalt helyek átlagos pozíciója számít. Két vagy több egyedi versenyzői rekord szükséges az összehasonlítható mezőhöz.",
  },
  {
    title: "Szezonrangsor divíziónként",
    description:
      "A versenyző szezonértéke az összehasonlítható verseny-divízió mezőkben elért percentiliseinek számtani átlaga. Minden divízió külön rangsort kap; a különböző divíziók eredményei nem kerülnek közös listába. Holtversenynél előbb a több értékelhető verseny, majd az alacsonyabb átlagos helyezés, végül a név szerinti sorrend dönt.",
  },
  {
    title: "Versenyző-azonosítás és egyesületi adatok",
    description:
      "Ha rendelkezésre áll, a rangsor a hivatalos versenyzői engedélyazonosítót használja az indulások összekapcsolásához; ennek hiányában a normalizált név alapján kapcsol. Az egyesületi adat megjelenítési és szűrési célú, nem módosítja a helyezési percentilist.",
  },
  {
    title: "Forrásértékek és adatminőség",
    description:
      "A nyers eredményérték, az eredményjegyzékben közölt százalék, a kategória, az osztály és az erőfaktor külön forrásmezőként marad meg. A rangsor nem hasonlítja közvetlenül össze a különböző versenyeken kapott pontokat. Hiányzó divíziójú, helyezésű vagy azonosítható versenyzőjű sorok nem kerülnek a rangsorba; a kizárások a szezonoldal adatminőségi részében láthatók.",
  },
];

async function resolveDiscipline(params: Promise<{ discipline: string }>) {
  const { discipline: slug } = await params;
  if (!isDisciplineSlug(slug)) notFound();
  const discipline = getDiscipline(slug);
  if (!discipline?.published || !["idpa", "ipsc"].includes(discipline.analytics)) notFound();
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
            <span className="brand-mark-top">{discipline.slug === "idpa" ? "HERO OF" : "LÖVÉSZNAPLÓ"}</span>
            <span className="brand-mark-bottom">{discipline.name}<span className="brand-period">.</span></span>
          </Link>
          <Link href={disciplinePath(discipline.slug)} className="source-link">Vissza az {discipline.name}-szezonokhoz</Link>
        </div>
      </header>
      <main className="methodology-main">
        <h1 className="font-display text-5xl font-extrabold leading-[0.95] md:text-6xl">
          {discipline.analytics === "ipsc" ? "IPSC-rangsorok és statisztikai módszertan" : "Statisztikai és pontszámítási módszertan"}
        </h1>
        <p className="mt-4 max-w-[68ch] text-base leading-7 text-[var(--ink-muted)]">
          A főbb mutatók számítását dokumentáljuk, hogy a szezoneredmények visszakövethetők legyenek a hivatalos forrásokhoz.
        </p>
        <div className="mt-10 space-y-7">
          {(discipline.analytics === "ipsc" ? ipscSections : idpaSections).map((section) => (
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
