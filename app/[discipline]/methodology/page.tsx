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

const imssuSections = [
  {
    title: "A versenymező: azonos verseny, azonos divízió",
    description:
      "Az IMSSU-eredményjegyzék Eredmény oszlopa a ledöntött fémsziluettek száma. Mivel a célok száma versenyenként eltérhet, a nyers találatszámokat csak azonos versenyen és azonos divízióban hasonlítjuk össze. A naptár minden szintje (minősítő, kiemelt minősítő, országos bajnokság, szint nélküli) bekerül; a szint külön jelölve marad. Egy mező akkor összehasonlítható, ha legalább két különböző versenyző érvényes, egész számú találatszámát tartalmazza.",
  },
  {
    title: "Találati percentilis",
    description:
      "Egy n fős mezőben a versenyző helyezése a nála több találatot elérők száma, plusz az azonos találatszámú versenyzők által elfoglalt helyek átlaga. A percentilis 100 × (n − helyezés) / (n − 1), 0 és 100 közé korlátozva: a legtöbb találat 100%, a legkevesebb 0%. Holtversenyben az azonos találatszám azonos percentilist kap; a szétlövés vagy más hivatalos sorrendképzés a hivatalos sorszámban látható, de a percentilist nem módosítja.",
  },
  {
    title: "Szezonrangsor divíziónként",
    description:
      "A versenyző szezonértéke a divízió összehasonlítható mezőiben elért percentilisek számtani átlaga. Holtversenynél előbb a több értékelhető verseny, majd a győztes találatszámához mért magasabb átlagos arány, végül a név szerinti sorrend dönt. A divíziók külön rangsort kapnak. A győzelmek és dobogós helyezések a hivatalos eredményjegyzék 1., illetve 1–3. sorszámát jelentik.",
  },
  {
    title: "A győzteshez mért arány",
    description:
      "Kiegészítő mutató: a versenyző találatszáma a mező legtöbb találatának százalékában. A rangsort nem határozza meg, csak holtversenyben dönt. Ha a mezőben senki nem ért el találatot, értéke nem számítható.",
  },
  {
    title: "Divíziómegnevezések",
    description:
      "A divíziók nevét a forrás szerint tartjuk meg, egyetlen kivétellel: a „Légpuska - Nemzetközi” és a „Légpuska NK (41m)” ugyanazt a nemzetközi, 41 m-es légpuskás versenyszámot jelöli. Ezt az MDLSZ versenykiírás (Légpuska Hazai 25 m – Légpuska Nemzetközi 41 m) és a 2026. évi országos bajnokság eredményjegyzéke is alátámasztja, amely ugyanazt a táblát mindkét néven közli. A két címke alatt ismétlődő sorokat versenyzőnként egyszer vesszük figyelembe.",
  },
  {
    title: "Azonosítás, megjegyzések és kizárások",
    description:
      "A numerikus versenyengedély-azonosító (V.eng.) kapcsolja össze a versenyző eredményeit, a vezető nullák figyelmen kívül hagyásával; hiányában a normalizált név. A korosztályi jelölések (junior, senior, super senior) és az országos csúcs jelölése a Megjegyzés oszlopból származik, a rangsort nem befolyásolja. Nem kerül rangsorba a divízió nélküli sor, a hiányzó találatszámú sor és az a sor, amelyben az Eredmény üres, de a Megjegyzés oszlopban szám áll (lehetséges oszlopeltolódás). Ezeket az adatminőségi részben versenyenként jelezzük.",
  },
];

const gyorskombinaltSections = [
  {
    title: "Részvétel, nem teljesítményrangsor",
    description: "A kimutatás a Gyorskombinált és Precíziós szakági naptár feldolgozott eredménysorait összesíti. Kvalifikációs, minősítő és precíziós események is szerepelhetnek benne. Nem számítunk szezonpontszámot, és nem alkalmazzuk az IDPA vagy az IPSC rangsorolási modelljét.",
  },
  {
    title: "Eredménysorok, versenyek és divíziók",
    description: "Az eredménysorok száma a feldolgozott forrássorok száma, nem feltétlenül az önálló indulásoké. A versenyek számát különböző naptári versenyazonosítók alapján mérjük. A divíziómegnevezéseket változatlanul tartjuk meg; eltérő fegyvernemek vagy eseménytípusok azonos nevű divíziói ebből nem válnak sporteredmény szempontjából összehasonlíthatóvá.",
  },
  {
    title: "Versenyzői előzmények és azonosítás",
    description: "A numerikus versenyengedély-azonosító összekapcsolja a rekordokat; a vezető nullák nem módosítják az azonosságot. Ha nincs használható engedélyazonosító, normalizált név alapján kapcsolunk. A névalapú és engedélyalapú rekordokat nem egyesítjük automatikusan. A versenyzőválasztó részvételi gyakoriság szerint rendez, nem eredményesség szerint.",
  },
  {
    title: "A forrásértékek értelmezési korlátai",
    description: "A „Sorszám” oszlop értéke forrássorszám, nem igazolt helyezés. A közölt eredmény, százalék és megjegyzés eredeti szövegként jelenik meg. A megjegyzésben szereplő numerikus értéket nem tekintjük automatikusan időeredménynek. Nem hasonlítjuk össze különböző versenyek pontértékeit.",
  },
  {
    title: "Szűrés, aktivitás és adatminőség",
    description: "A verseny-, divízió- és egyesületszűrő a részvételi táblát, a versenyzői előzményeket, az eredménykeresőt és a versenylistát módosítja. A hero, az aktivitási diagramok és a szezonkiemelések teljes szezonadatokat mutatnak. A havi diagram a verseny kezdő hónapját használja. A naptárhoz nem kapcsolható sorokat és az értelmezhetetlen dátumokat külön jelezzük; a feldolgozási diagnosztikák megtekinthetők.",
  },
];

const methodologyByAnalytics: Record<string, { title: string; description: string; sections: Array<{ title: string; description: string }> }> = {
  idpa: {
    title: "Statisztikai és pontszámítási módszertan",
    description: "Az IDPA rangsorainak, teljesítménymutatóinak és adatfeldolgozásának módszertana.",
    sections: idpaSections,
  },
  ipsc: {
    title: "IPSC-rangsorok és statisztikai módszertan",
    description: "Az IPSC rangsorainak, teljesítménymutatóinak és adatfeldolgozásának módszertana.",
    sections: ipscSections,
  },
  imssu: {
    title: "IMSSU-rangsorok és statisztikai módszertan",
    description: "Az IMSSU fémsziluett divíziórangsorainak, találati percentiliseinek és adatfeldolgozásának módszertana.",
    sections: imssuSections,
  },
  gyorskombinalt: {
    title: "Gyorskombinált: a forrásalapú kimutatás módszertana",
    description: "A Gyorskombinált részvételi kimutatásainak, forráseredményeinek és versenyzői azonosításának módszertana.",
    sections: gyorskombinaltSections,
  },
};

async function resolveDiscipline(params: Promise<{ discipline: string }>) {
  const { discipline: slug } = await params;
  if (!isDisciplineSlug(slug)) notFound();
  const discipline = getDiscipline(slug);
  if (!discipline?.published || !(discipline.analytics in methodologyByAnalytics)) notFound();
  return discipline;
}

export async function generateMetadata({ params }: PageProps<"/[discipline]/methodology">): Promise<Metadata> {
  const discipline = await resolveDiscipline(params);
  return {
    title: `${discipline.name} · módszertan`,
    description: methodologyByAnalytics[discipline.analytics].description,
    alternates: { canonical: canonicalUrl(methodologyPath(discipline.slug)) },
  };
}

export default async function MethodologyPage({ params }: PageProps<"/[discipline]/methodology">) {
  const discipline = await resolveDiscipline(params);
  const methodology = methodologyByAnalytics[discipline.analytics];
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
          <Link href={disciplinePath(discipline.slug)} className="source-link">
            Vissza {/^[aáeéiíoóöőuúüű]/i.test(discipline.name) ? "az" : "a"} {discipline.name}-szezonokhoz
          </Link>
        </div>
      </header>
      <main className="methodology-main">
        <h1 className="font-display text-5xl font-extrabold leading-[0.95] md:text-6xl">
          {methodology.title}
        </h1>
        <p className="mt-4 max-w-[68ch] text-base leading-7 text-[var(--ink-muted)]">
          A főbb mutatók számítását dokumentáljuk, hogy a szezoneredmények visszakövethetők legyenek a hivatalos forrásokhoz.
        </p>
        <div className="mt-10 space-y-7">
          {methodology.sections.map((section) => (
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
