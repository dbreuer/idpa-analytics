"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight } from "lucide-react";

import { SectionChart } from "@/components/charts/section-chart";
import { CompetitionTimeline } from "@/components/competition/competition-timeline";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { SiteFooter } from "@/components/layout/site-footer";
import { TopCompetitors } from "@/components/leaderboard/top-competitors";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { axisStroke, chartPalette, gridStroke, tooltipStyle } from "@/lib/chart-theme";
import { methodologyPath } from "@/lib/discipline-paths";
import type { Discipline } from "@/lib/disciplines";
import type {
  ClubStanding,
  CompetitionDiscoveryFile,
  CompetitorStanding,
  DataQuality,
  QualityFile,
  ResultsFile,
  StatisticsSnapshot,
} from "@/lib/types";
import { formatDate, formatNullableNumber, formatNumber } from "@/lib/utils";

interface DashboardAppProps {
  discipline: Discipline;
  year: number;
  availableYears: number[];
  competitionsFile: CompetitionDiscoveryFile;
  resultsFile: ResultsFile;
  qualityFile: QualityFile;
  statistics: StatisticsSnapshot;
}

const qualityLabels: Record<keyof DataQuality, string> = {
  totalPdfsDiscovered: "Talált PDF-dokumentumok",
  successfullyProcessedPdfs: "Sikeresen feldolgozott PDF-ek",
  failedPdfs: "Sikertelenül feldolgozott PDF-ek",
  totalExtractedRows: "Kinyert adatsorok",
  validCompetitorRows: "Érvényes versenyzői adatsorok",
  rowsWithValidTime: "Érvényes időeredményt tartalmazó sorok",
  rowsWithMissingTeam: "Hiányzó egyesületi adatot tartalmazó sorok",
  rowsWithParsingErrors: "Feldolgozási hibát tartalmazó sorok",
};

function formatChartValue(value: unknown) {
  return typeof value === "number" ? formatNumber(value, Number.isInteger(value) ? 0 : 3) : String(value ?? "");
}

function SeasonFact({ label, value, name = false }: { label: string; value: string | number; name?: boolean }) {
  return (
    <div className="hero-ledger-item">
      <dt className="hero-ledger-label">{label}</dt>
      <dd className={`hero-ledger-value ${name ? "is-name" : ""}`}>
        {typeof value === "number" ? formatNumber(value) : value}
      </dd>
    </div>
  );
}

function MetricValue({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric-value">
      <dt className="editorial-kicker">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function DashboardApp({
  discipline,
  year,
  availableYears,
  competitionsFile,
  resultsFile,
  qualityFile,
  statistics,
}: DashboardAppProps) {
  const [competitionFilter, setCompetitionFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [clubFilter, setClubFilter] = useState("all");
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorStanding | null>(statistics.overallTop5[0] ?? null);
  const [selectedClub, setSelectedClub] = useState<ClubStanding | null>(statistics.clubsRanking[0] ?? null);

  const divisionOptions = useMemo(
    () => ["all", ...statistics.divisions.map((division) => division.division)],
    [statistics.divisions],
  );
  const clubOptions = useMemo(
    () => ["all", ...statistics.clubsRanking.map((club) => club.club)],
    [statistics.clubsRanking],
  );

  const filteredCompetitors = useMemo(() => {
    return statistics.competitors.filter((competitor) => {
      if (clubFilter !== "all" && competitor.club !== clubFilter) return false;
      if (divisionFilter !== "all" && !competitor.divisionSet.includes(divisionFilter)) return false;
      if (competitionFilter !== "all" && !competitor.competitionIds.includes(competitionFilter)) return false;
      return true;
    });
  }, [statistics.competitors, clubFilter, divisionFilter, competitionFilter]);

  const filteredTop5 = filteredCompetitors
    .slice()
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 5);
  const filteredClubs = statistics.clubsRanking
    .filter((club) => clubFilter === "all" || club.club === clubFilter)
    .slice(0, 5);
  const eliteMatrix = filteredCompetitors.slice(0, 40).map((competitor) => ({
    name: competitor.competitorName,
    x: competitor.uniqueCompetitions,
    y: Number(competitor.overallScore.toFixed(2)),
    z: competitor.podiums + 1,
  }));
  const speedVsConsistency = filteredCompetitors.slice(0, 40).map((competitor) => ({
    name: competitor.competitorName,
    x: Number(competitor.consistencyScore.toFixed(2)),
    y: Number((competitor.normalizedSpeedScore ?? 0).toFixed(3)),
    z: competitor.uniqueCompetitions + 2,
  }));

  const displayedCompetitor =
    selectedCompetitor &&
    filteredCompetitors.some((entry) => entry.normalizedCompetitorName === selectedCompetitor.normalizedCompetitorName)
      ? selectedCompetitor
      : filteredTop5[0] ?? null;
  const displayedClub =
    selectedClub && filteredClubs.some((entry) => entry.club === selectedClub.club)
      ? selectedClub
      : filteredClubs[0] ?? null;

  return (
    <>
      <DashboardHeader
        disciplineSlug={discipline.slug}
        disciplineName={discipline.name}
        year={year}
        availableYears={availableYears}
        competitionOptions={statistics.competitions.map((competition) => ({
          id: competition.competitionId,
          name: competition.competitionName,
        }))}
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
        <section
          id="overview"
          data-dashboard-section
          aria-labelledby="overview-title"
          className="season-hero"
        >
          <div className="season-hero-inner">
            <div>
              <h1 id="overview-title" className="hero-title">
                {discipline.name}
                <span className="hero-title-year">{year}. évi szezon</span>
              </h1>
              <p className="hero-description">
                Szezoneredmények és teljesítmény-összehasonlítások az MDLSZ hivatalos magyarországi versenyadatai alapján.
              </p>
              <div className="hero-source-line">
                <span>Adatfrissítés: {competitionsFile.generatedAt ? formatDate(competitionsFile.generatedAt) : "a dátum nem ismert"}</span>
                <span>Feldolgozott PDF-eredményjegyzékek: {qualityFile.quality.successfullyProcessedPdfs}/{qualityFile.quality.totalPdfsDiscovered}</span>
                <span>Feldolgozási hibát tartalmazó sorok: {qualityFile.quality.rowsWithParsingErrors}</span>
              </div>
            </div>
            <dl className="hero-ledger" aria-label={`A ${year}. évi szezon összesítése`}>
              <SeasonFact label="Versenyek" value={statistics.totalCompetitions} />
              <SeasonFact label="Versenyzők" value={statistics.uniqueCompetitors} />
              <SeasonFact label="Képviselt egyesületek" value={statistics.clubs} />
              <SeasonFact label="Eredménybejegyzések" value={statistics.totalEntries} />
              <SeasonFact label="Legjobb rögzített idő" value={formatNullableNumber(statistics.fastestRecordedTime, 2)} />
              <SeasonFact label="Legaktívabb versenyző" value={statistics.mostActiveCompetitor ?? "Nincs adat"} name />
            </dl>
          </div>
        </section>

        <main id="content" tabIndex={-1} className="dashboard-content">
          <section id="rankings" data-dashboard-section className="dashboard-section" aria-labelledby="rankings-title">
            <SectionHeading
              id="rankings-title"
              title="Szezonrangsorok"
              description="A versenyzői rangsor a verseny-, divízió- és egyesületszűrőt követi. Az egyesületi rangsort az egyesületszűrő módosítja; az összesített diagramok a teljes szezon adatait mutatják."
            />
            <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
              <TopCompetitors disciplineName={discipline.name} year={year} competitors={filteredTop5} onSelect={setSelectedCompetitor} />
              <Card className="club-panel">
                <CardTitle className="font-display text-3xl">Élen álló egyesületek</CardTitle>
                <CardDescription className="mt-1">
                  Az egyesületi összpontszám az öt legeredményesebb tag pontszámának összege; az átlagpontszám a tagok átlagos teljesítményét mutatja.
                </CardDescription>
                {filteredClubs.length ? (
                  <ol className="mt-5 m-0 list-none border-t-2 border-[var(--ink)] p-0">
                    {filteredClubs.map((club, index) => {
                      const maxPower = Math.max(filteredClubs[0]?.powerScore ?? 0, 1);
                      return (
                        <li key={club.club}>
                          <button
                            type="button"
                            onClick={() => setSelectedClub(club)}
                            aria-label={`${club.club} adatlapja`}
                            aria-pressed={displayedClub?.club === club.club}
                            className="editorial-row w-full p-4 text-left"
                          >
                            <span className="flex items-start justify-between gap-3">
                              <span className="flex min-w-0 items-start gap-3">
                                <span className={`rank-number ${index < 3 ? "rank-number-podium" : ""}`}>
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate font-semibold text-[var(--ink)]">{club.club}</span>
                                  <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">
                                    {club.members} versenyző · {club.appearances} indulás
                                  </span>
                                </span>
                              </span>
                              <span className="shrink-0 text-right">
                                <span className="block font-display text-xl font-bold leading-none tabular-nums">
                                  {formatNumber(club.powerScore, 0)}
                                </span>
                                <span className="mt-1 block text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                                  Összpontszám
                                </span>
                              </span>
                            </span>
                            <span className="score-track mt-3 block" aria-hidden="true">
                              <span style={{ width: `${Math.min((club.powerScore / maxPower) * 100, 100)}%` }} />
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="mt-5 border-y border-[var(--rule)] py-8 text-sm text-[var(--ink-muted)]">
                    A kiválasztott egyesülethez nem található rangsoradat. Módosítsa az egyesületszűrőt.
                  </p>
                )}
              </Card>
            </div>
          </section>

          <section id="analytics" data-dashboard-section className="dashboard-section" aria-labelledby="analytics-title">
            <SectionHeading
              id="analytics-title"
              title="Szezonstatisztikák"
              description="A divízió- és egyesületi összesítések a teljes szezont mutatják. A versenyzői pontdiagramok a rangsorszűrőket követik."
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <SectionChart title="Versenyzői teljesítmény" description="A versenyrészvételek száma és az összesített teljesítménypontszám közötti összefüggés.">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 18, right: 20, bottom: 18, left: 0 }}>
                    <CartesianGrid stroke={gridStroke} />
                    <XAxis type="number" dataKey="x" stroke={axisStroke} name="Versenyek" tick={{ fontSize: 11 }} />
                    <YAxis type="number" dataKey="y" stroke={axisStroke} name="Teljesítménypontszám" tickFormatter={formatChartValue} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={formatChartValue} cursor={{ strokeDasharray: "4 4" }} contentStyle={tooltipStyle} />
                    <Scatter data={eliteMatrix} fill={chartPalette[0]} />
                  </ScatterChart>
                </ResponsiveContainer>
              </SectionChart>
              <SectionChart title="Sebesség és kiegyensúlyozottság" description="A normalizált sebességmutató és a kiegyensúlyozottsági pontszám összehasonlítása.">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 18, right: 20, bottom: 18, left: 0 }}>
                    <CartesianGrid stroke={gridStroke} />
                    <XAxis type="number" dataKey="x" stroke={axisStroke} name="Kiegyensúlyozottság" tickFormatter={formatChartValue} tick={{ fontSize: 11 }} />
                    <YAxis type="number" dataKey="y" stroke={axisStroke} name="Normalizált sebesség" tickFormatter={formatChartValue} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={formatChartValue} contentStyle={tooltipStyle} />
                    <Scatter data={speedVsConsistency} fill={chartPalette[1]} />
                  </ScatterChart>
                </ResponsiveContainer>
              </SectionChart>
              <SectionChart title="Indulások divíziónként" description="A versenyzői indulások megoszlása divíziónként, a normalizált hivatalos eredmények alapján.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.divisions.slice(0, 8)} margin={{ top: 12, right: 8, bottom: 4, left: -18 }}>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="division" stroke={axisStroke} tick={{ fontSize: 11 }} />
                    <YAxis stroke={axisStroke} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={formatChartValue} contentStyle={tooltipStyle} />
                    <Bar dataKey="appearances" name="Indulások" radius={[2, 2, 0, 0]}>
                      {statistics.divisions.slice(0, 8).map((division, index) => (
                        <Cell key={division.division} fill={chartPalette[index % chartPalette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </SectionChart>
              <SectionChart title="Egyesületi teljesítmény" description="Az egyesületi összpontszám és a tagok átlagpontszámának összehasonlítása.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.clubsRanking.slice(0, 6)} layout="vertical" margin={{ top: 8, right: 14, bottom: 4, left: 24 }}>
                    <CartesianGrid stroke={gridStroke} horizontal={false} />
                    <XAxis type="number" stroke={axisStroke} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="club" stroke={axisStroke} width={112} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={formatChartValue} contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="powerScore" name="Egyesületi összpontszám" fill={chartPalette[0]} radius={[0, 2, 2, 0]} />
                    <Bar dataKey="strengthScore" name="Tagok átlagpontszáma" fill={chartPalette[1]} radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionChart>
            </div>
          </section>

          <section id="details" data-dashboard-section className="dashboard-section" aria-labelledby="details-title">
            <SectionHeading
              id="details-title"
              title="Versenyzői és egyesületi adatlapok"
              description="A szezonadatok megtekintéséhez válasszon versenyzőt vagy egyesületet a rangsorban."
            />
            <div className="grid gap-8 xl:grid-cols-2">
              <Card>
                <CardTitle className="font-display text-3xl">{displayedCompetitor?.competitorName ?? "Nincs kiválasztott versenyző"}</CardTitle>
                <CardDescription className="mt-1">{displayedCompetitor?.club ?? "Nincs egyesületi adat"}</CardDescription>
                {displayedCompetitor ? (
                  <>
                    <dl className="metric-grid mt-6">
                      <MetricValue label="Összesített pontszám" value={formatNumber(displayedCompetitor.overallScore, 0)} />
                      <MetricValue label="Győzelmek" value={displayedCompetitor.wins} />
                      <MetricValue label="Dobogós helyezések" value={displayedCompetitor.podiums} />
                      <MetricValue label="Versenyek" value={displayedCompetitor.uniqueCompetitions} />
                      <MetricValue label="Átlagos helyezés" value={formatNullableNumber(displayedCompetitor.averagePlacement, 2)} />
                      <MetricValue label="Legjobb idő" value={formatNullableNumber(displayedCompetitor.fastestTime, 2)} />
                    </dl>
                    <div className="mt-7 h-[260px] min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={displayedCompetitor.placementsByDate} margin={{ top: 12, right: 12, bottom: 8, left: -18 }}>
                          <CartesianGrid stroke={gridStroke} vertical={false} />
                          <XAxis dataKey="date" stroke={axisStroke} tickFormatter={formatDate} tick={{ fontSize: 10 }} />
                          <YAxis reversed stroke={axisStroke} allowDecimals={false} domain={[1, "dataMax"]} tick={{ fontSize: 10 }} />
                          <Tooltip formatter={formatChartValue} labelFormatter={(value) => formatDate(String(value))} contentStyle={tooltipStyle} />
                          <Line
                            type="monotone"
                            dataKey="placement"
                            name="Helyezés"
                            stroke={chartPalette[0]}
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: chartPalette[0], strokeWidth: 0 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <p className="mt-5 text-sm text-[var(--ink-muted)]">
                    Válasszon versenyzőt a rangsorból, vagy módosítsa a szűrőket a szezonadatok megjelenítéséhez.
                  </p>
                )}
              </Card>

              <Card>
                <CardTitle className="font-display text-3xl">{displayedClub?.club ?? "Nincs kiválasztott egyesület"}</CardTitle>
                <CardDescription className="mt-1">
                  {displayedClub ? `${displayedClub.members} versenyző · ${displayedClub.appearances} indulás` : "Az egyesületi mutatók az eredmények normalizálása után jelennek meg."}
                </CardDescription>
                {displayedClub ? (
                  <dl className="metric-grid mt-6">
                    <MetricValue label="Egyesületi összpontszám" value={formatNumber(displayedClub.powerScore, 0)} />
                    <MetricValue label="Tagok átlagpontszáma" value={formatNumber(displayedClub.strengthScore, 0)} />
                    <MetricValue label="Győzelmek" value={displayedClub.wins} />
                    <MetricValue label="Dobogós helyezések" value={displayedClub.podiums} />
                    <MetricValue label="Átlagos helyezés" value={formatNullableNumber(displayedClub.averagePlacement, 2)} />
                    <MetricValue label="Legeredményesebb versenyző" value={displayedClub.topCompetitor ?? "Nincs adat"} />
                  </dl>
                ) : (
                  <p className="mt-5 text-sm text-[var(--ink-muted)]">
                    Válasszon egyesületet a rangsorból, vagy módosítsa az egyesületszűrőt.
                  </p>
                )}
              </Card>
            </div>
          </section>

          <section id="competitions" data-dashboard-section className="dashboard-section" aria-labelledby="competitions-title">
            <SectionHeading
              id="competitions-title"
              title={`${year}. évi versenyek`}
              description="A feldolgozott IDPA-versenyek hivatalos versenynaptári adatai és elérhető PDF-eredményjegyzékei."
              aside={
                <a className="source-link" href={competitionsFile.sourceUrl} target="_blank" rel="noreferrer">
                  MDLSZ-versenynaptár <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </a>
              }
            />
            <CompetitionTimeline competitions={statistics.competitions} />
          </section>

          <section id="insights" data-dashboard-section className="dashboard-section" aria-labelledby="insights-title">
            <SectionHeading
              id="insights-title"
              title="A szezon kiemelkedő teljesítményei"
              description="A kiemelések a normalizált szezoneredmények alapján készülnek; a hiányzó értékeket „Nincs adat” jelölés mutatja."
            />
            <Card className="editorial-panel">
              <dl className="insights-list">
                {[
                  ["Legmagasabb összesített pontszám", statistics.insights.dominator],
                  ["Legjobb sebességmutató", statistics.insights.speedDemon],
                  ["Legtöbb versenyrészvétel", statistics.insights.ironman],
                  ["Legkiegyensúlyozottabb teljesítmény", statistics.insights.mrConsistent],
                  ["Legnagyobb fejlődés", statistics.insights.risingStar],
                  ["Legnépesebb verseny", statistics.insights.biggestCompetition],
                  ["Élen álló egyesület", statistics.insights.strongestClub],
                  ["Legmagasabb dobogós arány", statistics.insights.podiumMachine],
                ].map(([label, value]) => (
                  <div key={String(label)} className="insight-entry">
                    <dt>{label}</dt>
                    <dd>{value ?? "Nincs adat"}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                <Link href={methodologyPath(discipline.slug)} className="source-link">Pontszámítási módszertan</Link>
                <a className="source-link" href={competitionsFile.sourceUrl} target="_blank" rel="noreferrer">
                  Hivatalos MDLSZ-versenynaptár
                </a>
              </div>
            </Card>
          </section>

          <section id="data-quality" data-dashboard-section className="dashboard-section" aria-labelledby="quality-title">
            <SectionHeading
              id="quality-title"
              title="Adatminőség és visszakövethetőség"
              description="Az adatfeldolgozási hibák, a hiányos forrásadatok és a normalizálás során észlelt bizonytalanságok is megjelennek."
            />
            {!!competitionsFile.errors.length && (
              <Card className="quality-warning mb-6">
                <CardTitle>Forráselérési figyelmeztetések</CardTitle>
                <CardDescription className="mt-1">A szezon versenynaptárának feldolgozása során hibák merültek fel. Az alábbiak az eredeti technikai hibaüzenetek.</CardDescription>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {competitionsFile.errors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              </Card>
            )}
            {!!qualityFile.errors.length && (
              <Card className="quality-warning mb-6">
                <CardTitle>PDF-feldolgozási figyelmeztetések</CardTitle>
                <CardDescription className="mt-1">Az alábbiak az eredeti technikai hibaüzenetek.</CardDescription>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {qualityFile.errors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              </Card>
            )}
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <Card>
                <CardTitle className="font-display text-3xl">Feldolgozási minőség</CardTitle>
                <CardDescription className="mt-1">A szezon adatkinyerési és normalizálási folyamatának összesített mutatói.</CardDescription>
                <dl className="quality-grid mt-5">
                  {Object.entries(qualityLabels).map(([key, label]) => (
                    <MetricValue key={key} label={label} value={formatNumber(qualityFile.quality[key as keyof DataQuality])} />
                  ))}
                </dl>
              </Card>
              <Card>
                <CardTitle className="font-display text-3xl">Eredmények és forrásadatok</CardTitle>
                <CardDescription className="mt-1">A szezon összesítései visszakövethetők a hivatalos forrásadatokhoz.</CardDescription>
                <dl className="quality-grid mt-5">
                  <MetricValue label="Talált versenyek" value={competitionsFile.discoveredCount} />
                  <MetricValue label="Normalizált eredménysorok" value={resultsFile.results.length} />
                  <MetricValue label="Feldolgozási hibás sorok" value={resultsFile.parsingErrors.length} />
                  <MetricValue label="Bizonytalan versenyzőazonosítások" value={resultsFile.ambiguousCompetitors.length} />
                </dl>
                <p className="mt-5 border-t border-[var(--rule)] pt-4 text-sm leading-6 text-[var(--ink-muted)]">
                  Az időeredmények csak az adott verseny legjobb érvényes idejéhez viszonyított normalizálás után használhatók versenyek közötti összehasonlításra.
                </p>
              </Card>
            </div>
          </section>
        </main>
        <SiteFooter disciplineSlug={discipline.slug} year={year} />
      </div>
    </>
  );
}
