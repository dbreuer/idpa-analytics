import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { Card } from "@/components/ui/card";
import { disciplinePath, seasonPath } from "@/lib/discipline-paths";
import { getDisciplineMark, type Discipline } from "@/lib/disciplines";
import { summarizeSourceResults } from "@/lib/discipline-summary";
import type { CompetitionDiscoveryFile, QualityFile, ResultsFile } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

interface DescriptiveDisciplineReportProps {
  discipline: Discipline;
  year: number;
  availableYears: number[];
  competitionsFile: CompetitionDiscoveryFile;
  resultsFile: ResultsFile;
  qualityFile: QualityFile;
}

function ReportFact({ label, value }: { label: string; value: number }) {
  return (
    <div className="hero-ledger-item">
      <dt className="hero-ledger-label">{label}</dt>
      <dd className="hero-ledger-value">{formatNumber(value)}</dd>
    </div>
  );
}

function dateTimeValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export function DescriptiveDisciplineReport({
  discipline,
  year,
  availableYears,
  competitionsFile,
  resultsFile,
  qualityFile,
}: DescriptiveDisciplineReportProps) {
  const mark = getDisciplineMark(discipline.slug);
  if (!mark) {
    throw new Error(`Missing official discipline logo metadata for ${discipline.slug}.`);
  }

  const summary = summarizeSourceResults(resultsFile.results);
  const rowsByCompetition = new Map<string, number>();
  for (const result of resultsFile.results) {
    rowsByCompetition.set(result.competitionId, (rowsByCompetition.get(result.competitionId) ?? 0) + 1);
  }

  return (
    <>
      <BreadcrumbJsonLd items={[
        { label: "Lövésznapló statisztika", path: "/" },
        { label: discipline.name, path: disciplinePath(discipline.slug) },
        { label: `${year}. szezon` },
      ]} />
      <header className="methodology-nav">
        <div className="methodology-nav-inner">
          <Link href={disciplinePath(discipline.slug)} className="brand-mark" aria-label={`${discipline.name} szezonáttekintés`}>
            <span className="brand-mark-top">LÖVÉSZNAPLÓ</span>
            <span className="brand-mark-bottom">{discipline.name}<span className="brand-period">.</span></span>
          </Link>
          <nav aria-label="Elérhető szezonok" className="flex flex-wrap items-center gap-1">
            <span className="mr-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">Szezon</span>
            {availableYears.map((availableYear) => (
              <Link
                key={availableYear}
                href={seasonPath(discipline.slug, availableYear)}
                aria-current={availableYear === year ? "page" : undefined}
                className={`section-nav-link ${availableYear === year ? "section-nav-link-active" : ""}`}
              >
                {availableYear}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="methodology-main max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-[var(--rule)] pb-8 sm:flex-row sm:items-center sm:gap-8">
          <Image
            src={mark.logo}
            width={mark.width}
            height={mark.height}
            alt=""
            className="h-auto w-32 shrink-0 object-contain"
          />
          <div>
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] md:text-7xl">
              {discipline.name} · {year}
            </h1>
            <p className="mt-4 max-w-[68ch] text-base leading-7 text-[var(--ink-muted)]">
              Forrásból normalizált verseny- és eredményadatok. Ez az áttekintés
              nem rangsorolja a versenyzőket, és nem alkalmaz IDPA-pontozást más
              szakágak eredményeire.
            </p>
          </div>
        </div>

        <section className="mt-8" aria-labelledby="source-summary">
          <h2 id="source-summary" className="sr-only">Szezonadatok összesítése</h2>
          <dl className="hero-ledger grid grid-cols-2 border-t-2 border-[var(--ink)] md:grid-cols-4">
            <ReportFact label="Versenyek" value={competitionsFile.competitions.length} />
            <ReportFact label="Normalizált eredménysorok" value={summary.resultRows} />
            <ReportFact label="Egyedi névazonosítók" value={summary.distinctNameIdentifiers} />
            <ReportFact label="Képviselt egyesületek" value={summary.representedClubs} />
          </dl>
        </section>

        <section className="dashboard-section" aria-labelledby="division-summary-title">
          <SectionHeading
            id="division-summary-title"
            title="Eredménysorok divíziónként"
            description="A megjelenített érték a forrásból normalizált eredménysorok száma, nem pontszám vagy helyezési rangsor."
          />
          <Card>
            {summary.divisionCounts.length ? (
              <dl className="quality-grid">
                {summary.divisionCounts.map(({ division, entries }) => (
                  <div className="metric-value" key={division}>
                    <dt className="editorial-kicker">{division}</dt>
                    <dd>{formatNumber(entries)}</dd>
                  </div>
                ))}
                {summary.rowsWithoutDivision > 0 ? (
                  <div className="metric-value">
                    <dt className="editorial-kicker">Divízióadat nélkül</dt>
                    <dd>{formatNumber(summary.rowsWithoutDivision)}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="text-sm leading-6 text-[var(--ink-muted)]">
                A feldolgozott eredménysorokhoz nem áll rendelkezésre divízióadat.
              </p>
            )}
          </Card>
        </section>

        <section className="dashboard-section" aria-labelledby="competitions-title">
          <SectionHeading
            id="competitions-title"
            title={`${year}. évi versenyek`}
            description="A versenyek hivatalos forrásoldalai és az elérhető eredményjegyzékek."
          />
          {competitionsFile.competitions.length ? (
            <ol className="competition-list">
              {competitionsFile.competitions.map((competition) => {
                const resultRows = rowsByCompetition.get(competition.id) ?? 0;
                return (
                  <li key={competition.id} className="competition-entry">
                    <div className="competition-date">
                      <time dateTime={dateTimeValue(competition.date)}>{formatDate(competition.date)}</time>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="competition-name">{competition.name}</h3>
                      <p className="mt-1 text-sm text-[var(--ink-muted)]">
                        {competition.location ?? "A helyszín nem ismert"}
                      </p>
                      <dl className="competition-facts">
                        <div><dt>Normalizált eredménysorok</dt><dd>{formatNumber(resultRows)}</dd></div>
                        <div>
                          <dt>Eredményjegyzék</dt>
                          <dd>
                            {competition.resultPdfUrl ? "Elérhető" : competition.downloadStatus === "failed" ? "Letöltési hiba" : "Nem található"}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        <a href={competition.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
                          Hivatalos versenyadatok <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </a>
                        {competition.resultPdfUrl ? (
                          <a href={competition.resultPdfUrl} target="_blank" rel="noreferrer" className="source-link">
                            Eredmény-PDF <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="border-y border-[var(--rule)] py-10 text-sm text-[var(--ink-muted)]">
              Ehhez a szezonhoz nem található feldolgozott versenyadat.
            </p>
          )}
        </section>

        <section id="data-quality" className="dashboard-section" aria-labelledby="data-quality-title">
          <SectionHeading
            id="data-quality-title"
            title="Adatminőség és visszakövethetőség"
            description="A megjelenített összesítések a letöltött hivatalos forrásokból normalizált adatsorokat számolják."
          />
          <Card>
            <dl className="quality-grid">
              <div className="metric-value">
                <dt className="editorial-kicker">Feldolgozott PDF-ek</dt>
                <dd>{formatNumber(qualityFile.quality.successfullyProcessedPdfs)} / {formatNumber(qualityFile.quality.totalPdfsDiscovered)}</dd>
              </div>
              <div className="metric-value">
                <dt className="editorial-kicker">Hibás PDF-feldolgozások</dt>
                <dd>{formatNumber(qualityFile.quality.failedPdfs)}</dd>
              </div>
              <div className="metric-value">
                <dt className="editorial-kicker">Feldolgozási hibás sorok</dt>
                <dd>{formatNumber(resultsFile.parsingErrors.length)}</dd>
              </div>
              <div className="metric-value">
                <dt className="editorial-kicker">Bizonytalan névazonosítások</dt>
                <dd>{formatNumber(resultsFile.ambiguousCompetitors.length)}</dd>
              </div>
              <div className="metric-value">
                <dt className="editorial-kicker">Divízióadat nélküli sorok</dt>
                <dd>{formatNumber(summary.rowsWithoutDivision)}</dd>
              </div>
            </dl>
            {qualityFile.errors.length ? (
              <ul className="mt-5 list-disc space-y-1 border-t border-[var(--rule)] pt-4 pl-5 text-sm text-[var(--ink-muted)]">
                {qualityFile.errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            ) : null}
            {competitionsFile.errors.length ? (
              <ul className="mt-5 list-disc space-y-1 border-t border-[var(--rule)] pt-4 pl-5 text-sm text-[var(--ink-muted)]">
                {competitionsFile.errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            ) : null}
          </Card>
        </section>
      </main>
      <SiteFooter disciplineSlug={discipline.slug} year={year} />
    </>
  );
}
