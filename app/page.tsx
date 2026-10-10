import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { disciplinePath } from "@/lib/discipline-paths";
import { disciplineDefinitions, getDisciplineMark } from "@/lib/disciplines";
import { getDisciplinesWithData, getPublishedDisciplines } from "@/lib/data";

export const metadata: Metadata = {
  title: "Magyar sportlövészeti eredmények és ranglisták",
  description: "Az MDLSZ szakágainak szezononkénti versenyeredményei és statisztikái, visszakövethető forrásadatokkal.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const published = new Set(getPublishedDisciplines().map((discipline) => discipline.slug));
  const withSeasonData = new Set(getDisciplinesWithData().map((discipline) => discipline.slug));

  return (
    <>
      <main className="empty-main min-h-screen">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <p className="editorial-kicker">LÖVÉSZNAPLÓ · SPORTLÖVÉSZETI ADATOK</p>
          <h1 className="mt-3 max-w-4xl font-display text-6xl font-extrabold leading-[0.92] md:text-8xl">
            Eredményekből<br />átlátható teljesítmény.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--ink-muted)] md:text-lg">
            Szezonrangsorok és versenystatisztikák az MDLSZ hivatalos adatforrásai alapján. Minden szakág a saját eredményei és szabályrendszere szerint jelenik meg.
          </p>
          <section className="mt-12" aria-labelledby="disciplines-title">
            <h2 id="disciplines-title" className="section-title">MDLSZ-szakágak</h2>
            <ul className="mt-5 grid list-none gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
              {disciplineDefinitions.map((discipline) => {
                const mark = getDisciplineMark(discipline.slug);
                if (!mark) return null;
                const isPublished = published.has(discipline.slug);
                const content = (
                  <Card className="h-full transition-colors hover:border-[var(--ink-muted)]">
                    <div className="flex items-center justify-between gap-5">
                      <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-sm bg-white p-2">
                        <Image
                          src={mark.logo}
                          width={mark.width}
                          height={mark.height}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      </span>
                      <span className="flex min-w-0 items-center gap-3 text-right">
                        <span className="min-w-0">
                          <CardTitle>{discipline.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {isPublished
                              ? discipline.analytics === "ipsc"
                                ? "Divíziórangsorok és szezonstatisztikák"
                                : "Eredmények és szezonranglisták"
                              : withSeasonData.has(discipline.slug)
                                ? "Forrásalapú eredménykimutatás"
                                : "Az adatfeldolgozás előkészítés alatt áll"}
                          </CardDescription>
                        </span>
                        <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--signal)]" />
                      </span>
                    </div>
                  </Card>
                );

                return (
                  <li key={discipline.slug}>
                    <Link
                      href={disciplinePath(discipline.slug)}
                      className="block h-full"
                      aria-label={`${discipline.name} szakági oldal megnyitása`}
                    >
                      {content}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
