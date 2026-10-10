"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight } from "lucide-react";

import { SectionChart } from "@/components/charts/section-chart";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { methodologyPath } from "@/lib/discipline-paths";
import { rankIpscResults, type IpscLeaderboardEntry, type IpscMatchResult, type IpscStatistics } from "@/lib/ipsc-statistics";
import type { CompetitionDiscoveryFile, QualityFile, ResultsFile } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

interface IpscDashboardProps {
  year: number;
  availableYears: number[];
  competitionsFile: CompetitionDiscoveryFile;
  resultsFile: ResultsFile;
  qualityFile: QualityFile;
  statistics: IpscStatistics;
}

function machineDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

const chartPalette = ["#a82e2c", "#176a63", "#976b17", "#675381", "#285e78", "#65655e", "#b86e28", "#4d7181"];
const gridStroke = "#dedacf";
const axisStroke = "#5d605c";
const tooltipStyle = {
  background: "#fffefa",
  border: "1px solid #d4d0c6",
  color: "#1a1b19",
  boxShadow: "0 8px 24px rgb(26 27 25 / 12%)",
  fontSize: 12,
};

function SeasonFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="hero-ledger-item">
      <dt className="hero-ledger-label">{label}</dt>
      <dd className="hero-ledger-value">{typeof value === "number" ? formatNumber(value) : value}</dd>
    </div>
  );
}

function FilteredLeaderboard({
  entries,
  onSelect,
  selectedKey,
}: {
  entries: IpscLeaderboardEntry[];
  onSelect: (entry: IpscLeaderboardEntry) => void;
  selectedKey: string | null;
}) {
  const visible = entries.slice(0, 10);

  if (!visible.length) {
    return (
      <p className="border-y border-[var(--rule)] py-8 text-sm text-[var(--ink-muted)]" role="status">
        Ehhez a szakághoz még nincs legalább két értékelhető, hivatalos helyezést tartalmazó eredménysor.
      </p>
    );
  }

  return (
    <ol className="m-0 list-none border-t-2 border-[var(--ink)] p-0">
      {visible.map((entry, index) => (
        <li key={entry.key}>
          <button
            type="button"
            onClick={() => onSelect(entry)}
            aria-label={`${entry.competitorName} versenyzői adatlapja`}
            aria-pressed={selectedKey === entry.key}
            className="editorial-row w-full p-4 text-left"
          >
            <span className="flex items-start justify-between gap-4">
              <span className="flex min-w-0 items-start gap-3">
                <span className={`rank-number ${index < 3 ? "rank-number-podium" : ""}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-[var(--ink)]">{entry.competitorName}</span>
                  <span className="mt-0.5 block truncate text-sm text-[var(--ink-muted)]">
                    {entry.club ?? "Nincs egyesületi adat"}
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-display text-2xl font-bold leading-none tabular-nums">
                  {formatNumber(entry.averagePercentile, 1)}%
                </span>
                <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                  Átlagos helyezési percentilis
                </span>
              </span>
            </span>
            <span className="score-track mt-3 block" aria-hidden="true">
              <span style={{ width: `${Math.max(0, Math.min(entry.averagePercentile, 100))}%` }} />
            </span>
            <span className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[var(--ink-muted)] sm:grid-cols-4">
              <span>Értékelhető verseny <strong className="text-[var(--ink)]">{entry.matchCount}</strong></span>
              <span>Győzelem <strong className="text-[var(--ink)]">{entry.wins}</strong></span>
              <span>Dobogó <strong className="text-[var(--ink)]">{entry.podiums}</strong></span>
              <span>Legjobb helyezés <strong className="text-[var(--ink)]">{entry.bestPlacement}.</strong></span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function resultDisplay(result: IpscMatchResult) {
  if (result.resultPercentage !== undefined) return `${formatNumber(result.resultPercentage, 2)}%`;
  return result.rawResult || "Nincs közölt érték";
}

function CompetitorProfile({ entry }: { entry: IpscLeaderboardEntry | null }) {
  return (
    <Card>
      <CardTitle className="font-display text-3xl">{entry?.competitorName ?? "Nincs kiválasztott versenyző"}</CardTitle>
      <CardDescription className="mt-1">
        {entry ? `${entry.division} · ${entry.club ?? "Nincs egyesületi adat"}` : "Válasszon egy versenyzőt a divíziórangsorban."}
      </CardDescription>
      {entry ? (
        <>
          <dl className="metric-grid mt-6">
            <div className="metric-value"><dt className="editorial-kicker">Helyezési percentilis átlaga</dt><dd>{formatNumber(entry.averagePercentile, 2)}%</dd></div>
            <div className="metric-value"><dt className="editorial-kicker">Értékelhető versenyek</dt><dd>{formatNumber(entry.matchCount)}</dd></div>
            <div className="metric-value"><dt className="editorial-kicker">Átlagos helyezés</dt><dd>{formatNumber(entry.averagePlacement, 2)}.</dd></div>
            <div className="metric-value"><dt className="editorial-kicker">Győzelmek / dobogók</dt><dd>{entry.wins} / {entry.podiums}</dd></div>
          </dl>
          <div className="mt-7 overflow-x-auto border-t border-[var(--rule)]">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--rule)] text-xs uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                  <th scope="col" className="py-3 pr-4 font-semibold">Verseny</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Helyezés</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Percentilis</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Eredmény</th>
                  <th scope="col" className="py-3 font-semibold">Forrás</th>
                </tr>
              </thead>
              <tbody>
                {entry.results.map((result) => (
                  <tr key={`${result.competitionId}-${result.division}`} className="border-b border-[var(--rule)]">
                    <td className="py-3 pr-4">
                      <span className="block font-medium text-[var(--ink)]">{result.competitionName}</span>
                      <time className="mt-0.5 block text-xs text-[var(--ink-muted)]" dateTime={machineDate(result.competitionDate)}>
                        {formatDate(result.competitionDate)}
                      </time>
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{result.placement}.</td>
                    <td className="py-3 pr-4 tabular-nums">{formatNumber(result.percentile, 2)}%</td>
                    <td className="py-3 pr-4 tabular-nums">{resultDisplay(result)}</td>
                    <td className="py-3">
                      <a href={result.resultPdfUrl ?? result.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
                        Eredmény <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="mt-5 text-sm text-[var(--ink-muted)]">A szűrők módosításával jelenítsen meg értékelhető eredményeket.</p>
      )}
    </Card>
  );
}

export function IpscDashboard({
  year,
  availableYears,
  competitionsFile,
  resultsFile,
  qualityFile,
  statistics,
}: IpscDashboardProps) {
  const [competitionFilter, setCompetitionFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [clubFilter, setClubFilter] = useState("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const divisionOptions = useMemo(
    () => ["all", ...statistics.divisions.map((division) => division.value)],
    [statistics.divisions],
  );
  const clubOptions = useMemo(
    () => ["all", ...new Set(statistics.leaderboard.map((entry) => entry.club).filter((club): club is string => Boolean(club)))],
    [statistics.leaderboard],
  );
  const filteredMatchResults = useMemo(
    () => statistics.leaderboard.flatMap((entry) => entry.results).filter((result) =>
      (competitionFilter === "all" || result.competitionId === competitionFilter)
      && (divisionFilter === "all" || result.division === divisionFilter)
      && (clubFilter === "all" || result.club === clubFilter),
    ),
    [statistics.leaderboard, competitionFilter, divisionFilter, clubFilter],
  );
  const filteredLeaderboard = useMemo(() => rankIpscResults(filteredMatchResults), [filteredMatchResults]);
  const divisionsToShow = divisionFilter === "all"
    ? statistics.divisions.map(({ value }) => value)
    : [divisionFilter];
  const selectedEntry = filteredLeaderboard.find((entry) => entry.key === selectedKey) ?? filteredLeaderboard[0] ?? null;

  const divisionChart = statistics.divisions.slice(0, 10);
  const competitionChart = statistics.competitions
    .filter((competition) => competition.eligibleRows > 0)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((competition) => ({
      name: competition.name.length > 24 ? `${competition.name.slice(0, 22)}…` : competition.name,
      date: competition.date,
      results: competition.eligibleRows,
    }));
  const categoryChart = statistics.categories.slice(0, 8);
  const classificationChart = statistics.classifications.slice(0, 8);

  return (
    <>
      <DashboardHeader
        disciplineSlug="ipsc"
        disciplineName="IPSC"
        year={year}
        availableYears={availableYears}
        competitionOptions={statistics.competitions.map(({ id, name }) => ({ id, name }))}
        divisionOptions={divisionOptions}
        clubOptions={clubOptions}
        competition={competitionFilter}
        division={divisionFilter}
        club={clubFilter}
        onCompetitionChange={setCompetitionFilter}
        onDivisionChange={setDivisionFilter}
        onClubChange={setClubFilter}
      />

      <div className="dashboard-main">
        <section id="overview" data-dashboard-section aria-labelledby="overview-title" className="season-hero">
          <div className="season-hero-inner">
            <div>
              <h1 id="overview-title" className="hero-title">
                IPSC
                <span className="hero-title-year">{year}. évi szezon</span>
              </h1>
              <p className="hero-description">
                Divíziónként elkülönített, versenyen belüli helyezésekből számított szezonkimutatás,
                hivatalos MDLSZ-eredményjegyzékekre visszavezetve.
              </p>
              <div className="hero-source-line">
                <span>Adatfrissítés: {competitionsFile.generatedAt ? formatDate(competitionsFile.generatedAt) : "a dátum nem ismert"}</span>
                <span>Összehasonlítható verseny-divízió mezők: {formatNumber(statistics.comparableMatchDivisions)}</span>
                <span>Rangsorba bevont eredménysorok: {formatNumber(statistics.comparableResultRows)}</span>
              </div>
            </div>
            <dl className="hero-ledger" aria-label={`A ${year}. évi IPSC-szezon összesítése`}>
              <SeasonFact label="Versenyek a naptárban" value={statistics.competitionCount} />
              <SeasonFact label="Level 1–3 versenyek rangsorral" value={statistics.levelMatchCount} />
              <SeasonFact label="Rangsorolt versenyzők" value={new Set(statistics.leaderboard.map((entry) => entry.competitorKey)).size} />
              <SeasonFact label="Értékelhető eredmények" value={statistics.comparableResultRows} />
              <SeasonFact label="Divíziók" value={statistics.divisions.length} />
              <SeasonFact label="Képviselt egyesületek" value={statistics.representedClubs} />
            </dl>
          </div>
        </section>

        <main id="content" tabIndex={-1} className="dashboard-content">
          <section id="rankings" data-dashboard-section className="dashboard-section" aria-labelledby="rankings-title">
            <SectionHeading
              id="rankings-title"
              title="Divíziórangsorok"
              description="A sorrendet az egyes versenyek és divíziók eredménymezőjében elért helyezésből számított percentilisek átlaga adja. A divíziók eredményei külön listákban szerepelnek."
              aside={<a href={methodologyPath("ipsc")} className="source-link">A rangsor módszertana</a>}
            />
            {divisionsToShow.length ? (
              <div className="space-y-10">
                {divisionsToShow.map((division) => (
                  <section key={division} aria-labelledby={`division-${encodeURIComponent(division)}`}>
                    <h3 id={`division-${encodeURIComponent(division)}`} className="mb-4 font-display text-3xl font-bold">
                      {division}
                    </h3>
                    <FilteredLeaderboard
                      entries={filteredLeaderboard.filter((entry) => entry.division === division)}
                      selectedKey={selectedKey}
                      onSelect={(entry) => setSelectedKey(entry.key)}
                    />
                  </section>
                ))}
              </div>
            ) : (
              <Card>
                <CardTitle>Nincs rangsorolható IPSC-eredmény</CardTitle>
                <CardDescription className="mt-2 leading-6">
                  A rangsor csak Level 1–3 versenyen, azonos divízióban legalább két versenyző érvényes helyezéséből készül.
                </CardDescription>
              </Card>
            )}
          </section>

          <section id="analytics" data-dashboard-section className="dashboard-section" aria-labelledby="analytics-title">
            <SectionHeading
              id="analytics-title"
              title="Szezonstatisztikák"
              description="A diagramok feldolgozott versenyeredményeket összesítenek; a különböző versenyek pontértékei nem kerülnek közös skálára."
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <SectionChart title="Eredmények divíziónként" description="Összehasonlítható eredménysorok száma a divíziók mezőiben.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={divisionChart} margin={{ top: 12, right: 12, bottom: 28, left: 0 }}>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="value" stroke={axisStroke} angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10 }} />
                    <YAxis stroke={axisStroke} allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatNumber(Number(value))} contentStyle={tooltipStyle} />
                    <Bar dataKey="entries" name="Eredménysor" fill={chartPalette[0]} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionChart>
              <SectionChart title="Értékelhető indulások versenyenként" description="Azok a versenyzői eredmények, amelyek érvényes helyezéssel és azonosítható divízióval rendelkeznek.">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={competitionChart} margin={{ top: 12, right: 16, bottom: 48, left: 0 }}>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="name" stroke={axisStroke} angle={-32} textAnchor="end" interval="preserveStartEnd" tick={{ fontSize: 9 }} />
                    <YAxis stroke={axisStroke} allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
                      formatter={(value) => formatNumber(Number(value))}
                      contentStyle={tooltipStyle}
                    />
                    <Line type="monotone" dataKey="results" name="Értékelhető eredmény" stroke={chartPalette[1]} strokeWidth={2.5} dot={{ r: 2.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </SectionChart>
              <SectionChart title="Kategória szerinti eredmények" description="A hivatalos eredménylistában közölt kategória megoszlása.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChart} margin={{ top: 12, right: 12, bottom: 12, left: 0 }}>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="value" stroke={axisStroke} tick={{ fontSize: 10 }} />
                    <YAxis stroke={axisStroke} allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatNumber(Number(value))} contentStyle={tooltipStyle} />
                    <Bar dataKey="entries" name="Eredménysor" radius={[2, 2, 0, 0]}>
                      {categoryChart.map((entry, index) => <Cell key={entry.value} fill={chartPalette[index % chartPalette.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </SectionChart>
              <SectionChart title="Osztály és erőfaktor" description="A forrásból kinyert IPSC-osztályozás és erőfaktor-mezők előfordulása.">
                <div className="grid h-full grid-cols-2 gap-5">
                  {[["Osztály", classificationChart], ["Erőfaktor", statistics.powerFactors]].map(([title, values]) => {
                    const items = values as typeof classificationChart;
                    return (
                      <div key={title as string} className="min-w-0 overflow-y-auto">
                        <h4 className="mb-3 text-sm font-semibold text-[var(--ink)]">{title as string}</h4>
                        <dl className="space-y-3">
                          {items.slice(0, 8).map((item) => (
                            <div key={item.value} className="flex items-baseline justify-between gap-2 border-b border-[var(--rule)] pb-2 text-sm">
                              <dt className="truncate text-[var(--ink-muted)]">{item.value}</dt>
                              <dd className="shrink-0 tabular-nums">{formatNumber(item.entries)}</dd>
                            </div>
                          ))}
                          {!items.length ? <p className="text-sm text-[var(--ink-muted)]">Nincs adat.</p> : null}
                        </dl>
                      </div>
                    );
                  })}
                </div>
              </SectionChart>
            </div>
          </section>

          <section id="details" data-dashboard-section className="dashboard-section" aria-labelledby="details-title">
            <SectionHeading
              id="details-title"
              title="Versenyzői adatlap és szezonelőzmények"
              description="Válasszon versenyzőt a rangsorból a helyezések, a versenyen belüli percentilisek és az eredményforrások megtekintéséhez."
            />
            <CompetitorProfile entry={selectedEntry} />
          </section>

          <section id="competitions" data-dashboard-section className="dashboard-section" aria-labelledby="competitions-title">
            <SectionHeading
              id="competitions-title"
              title={`${year}. évi IPSC-versenyek`}
              description="Versenyenként feltüntetjük a feldolgozott eredménysorokat, a rangsorba bevont sorokat és az elérhető hivatalos forrásokat."
              aside={<a className="source-link" href={competitionsFile.sourceUrl} target="_blank" rel="noreferrer">MDLSZ-versenynaptár <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></a>}
            />
            {statistics.competitions.length ? (
              <ol className="competition-list">
                {statistics.competitions.map((competition) => (
                  <li key={competition.id} className="competition-entry">
                    <div className="competition-date"><time dateTime={machineDate(competition.date)}>{formatDate(competition.date)}</time></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="competition-name">{competition.name}</h3>
                      <p className="mt-1 text-sm text-[var(--ink-muted)]">
                        {[competition.location, competition.level].filter(Boolean).join(" · ") || "A verseny szintje nincs megadva"}
                      </p>
                      <dl className="competition-facts">
                        <div><dt>Feldolgozott sorok</dt><dd>{formatNumber(competition.resultRows)}</dd></div>
                        <div><dt>Rangsorba bevont sorok</dt><dd>{formatNumber(competition.eligibleRows)}</dd></div>
                        <div><dt>Divíziók</dt><dd>{competition.divisions.join(", ") || "Nincs összehasonlítható adat"}</dd></div>
                      </dl>
                      {competition.downloadStatus && competition.downloadStatus !== "downloaded" ? (
                        <p className="mt-3 break-words text-sm font-medium text-[var(--signal)]">
                          {competition.downloadStatus === "failed" ? "Az eredmény-PDF letöltése sikertelen." : "A versenyhez nem érhető el feldolgozható eredmény-PDF."}
                          {competition.downloadError ? ` ${competition.downloadError}` : ""}
                        </p>
                      ) : null}
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
                ))}
              </ol>
            ) : (
              <p className="border-y border-[var(--rule)] py-10 text-sm text-[var(--ink-muted)]">Ehhez a szezonhoz nem található versenyadat.</p>
            )}
          </section>

          <section id="insights" data-dashboard-section className="dashboard-section" aria-labelledby="insights-title">
            <SectionHeading
              id="insights-title"
              title="Szezonkiemelések"
              description="Az alábbi értékek leíró összesítések a divíziónkénti eredményekről, nem hivatalos IPSC-bajnoki címek."
            />
            <Card className="editorial-panel">
              <dl className="insights-list">
                <div className="insight-entry"><dt>Legtöbb összehasonlítható divízióverseny</dt><dd>{formatNumber(statistics.comparableMatchDivisions)}</dd></div>
                <div className="insight-entry"><dt>Rangsorba vont versenyzői eredmények</dt><dd>{formatNumber(statistics.comparableResultRows)}</dd></div>
                <div className="insight-entry"><dt>Eredményjegyzékben közölt százalék</dt><dd>{formatNumber(statistics.resultPercentagesAvailable)}</dd></div>
                <div className="insight-entry"><dt>Azonos versenyzőazonosítóhoz összevont ismétlődő sorok</dt><dd>{formatNumber(statistics.duplicateIdentityRows)}</dd></div>
              </dl>
              <p className="mt-6 border-t border-[var(--rule)] pt-4 text-sm leading-6 text-[var(--ink-muted)]">
                A rangsorok csak azonos divíziókban és Level 1–3 versenyeken elért helyezéseket veszik figyelembe.
                A licencvizsgák és a hiányos eredményadatok nem befolyásolják a versenystatisztikát.
              </p>
            </Card>
          </section>

          <section id="data-quality" data-dashboard-section className="dashboard-section" aria-labelledby="quality-title">
            <SectionHeading
              id="quality-title"
              title="Adatminőség és visszakövethetőség"
              description="A hiányos verseny-, divízió- és helyezésadatok nyíltan megjelennek, nem kerülnek találgatással rangsorba."
            />
            {!!competitionsFile.errors.length && (
              <Card className="quality-warning mb-6">
                <CardTitle>Versenynaptár-feldolgozási figyelmeztetések</CardTitle>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {competitionsFile.errors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              </Card>
            )}
            {!!qualityFile.errors.length && (
              <Card className="quality-warning mb-6">
                <CardTitle>PDF-feldolgozási figyelmeztetések</CardTitle>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {qualityFile.errors.slice(0, 30).map((error) => <li key={error}>{error}</li>)}
                </ul>
                {qualityFile.errors.length > 30 ? <p className="mt-3 text-sm">További figyelmeztetések: {formatNumber(qualityFile.errors.length - 30)}</p> : null}
              </Card>
            )}
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <Card>
                <CardTitle className="font-display text-3xl">Feldolgozási minőség</CardTitle>
                <CardDescription className="mt-1">A szezon adatkinyerési folyamatának ellenőrző számai.</CardDescription>
                <dl className="quality-grid mt-5">
                  {[
                    ["Talált PDF-ek", qualityFile.quality.totalPdfsDiscovered],
                    ["Sikeresen feldolgozott PDF-ek", qualityFile.quality.successfullyProcessedPdfs],
                    ["Sikertelen PDF-feldolgozások", qualityFile.quality.failedPdfs],
                    ["Kinyert adatsorok", qualityFile.quality.totalExtractedRows],
                    ["Feldolgozási hibás sorok", resultsFile.parsingErrors.length],
                    ["Bizonytalan névazonosítások", resultsFile.ambiguousCompetitors.length],
                  ].map(([label, value]) => (
                    <div className="metric-value" key={label as string}>
                      <dt className="editorial-kicker">{label as string}</dt>
                      <dd>{formatNumber(value as number)}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
              <Card>
                <CardTitle className="font-display text-3xl">Rangsorolási kizárások</CardTitle>
                <CardDescription className="mt-1">Ezek az adatok a forrásokban megmaradnak, de a divíziórangsorhoz nem elégségesek.</CardDescription>
                <dl className="quality-grid mt-5">
                  <div className="metric-value"><dt className="editorial-kicker">Nem Level 1–3 eredménysorok</dt><dd>{formatNumber(statistics.rowsOutsideLevelMatches)}</dd></div>
                  <div className="metric-value"><dt className="editorial-kicker">Hiányzó divízióadat</dt><dd>{formatNumber(statistics.resultsWithoutDivision)}</dd></div>
                  <div className="metric-value"><dt className="editorial-kicker">Hiányzó vagy érvénytelen helyezés</dt><dd>{formatNumber(statistics.resultsWithoutPlacement)}</dd></div>
                  <div className="metric-value"><dt className="editorial-kicker">Összehasonlításra alkalmatlan mező</dt><dd>{formatNumber(statistics.matchDivisionsWithoutComparison)}</dd></div>
                </dl>
              </Card>
            </div>
          </section>
        </main>
        <SiteFooter disciplineSlug="ipsc" year={year} />
      </div>
    </>
  );
}
