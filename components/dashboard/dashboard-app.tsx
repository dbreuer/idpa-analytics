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
import type {
  ClubStanding,
  CompetitionDiscoveryFile,
  CompetitorStanding,
  QualityFile,
  ResultsFile,
  StatisticsSnapshot,
} from "@/lib/types";
import { formatDate, formatNullableNumber, formatNumber } from "@/lib/utils";

interface DashboardAppProps {
  year: number;
  availableYears: number[];
  competitionsFile: CompetitionDiscoveryFile;
  resultsFile: ResultsFile;
  qualityFile: QualityFile;
  statistics: StatisticsSnapshot;
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
  const [minimumParticipation, setMinimumParticipation] = useState(1);
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
      if (competitor.uniqueCompetitions < minimumParticipation) return false;
      if (clubFilter !== "all" && competitor.club !== clubFilter) return false;
      if (divisionFilter !== "all" && !competitor.divisionSet.includes(divisionFilter)) return false;
      if (competitionFilter !== "all" && !competitor.competitionIds.includes(competitionFilter)) return false;
      return true;
    });
  }, [statistics.competitors, minimumParticipation, clubFilter, divisionFilter, competitionFilter]);

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
        minimumParticipation={minimumParticipation}
        onCompetitionChange={setCompetitionFilter}
        onDivisionChange={setDivisionFilter}
        onClubChange={setClubFilter}
        onMinimumParticipationChange={setMinimumParticipation}
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
                IDPA
                <span className="hero-title-year">{year} season</span>
              </h1>
              <p className="hero-description">
                Season results and performance comparisons, grounded in official Hungarian MDLSZ competition records.
              </p>
              <div className="hero-source-line">
                <span>Generated {competitionsFile.generatedAt ? formatDate(competitionsFile.generatedAt) : "date unavailable"}</span>
                <span>Result PDFs {qualityFile.quality.successfullyProcessedPdfs}/{qualityFile.quality.totalPdfsDiscovered} processed</span>
                <span>{qualityFile.quality.rowsWithParsingErrors} rows with parsing issues</span>
              </div>
            </div>
            <dl className="hero-ledger" aria-label={`${year} season summary`}>
              <SeasonFact label="Competitions" value={statistics.totalCompetitions} />
              <SeasonFact label="Competitors" value={statistics.uniqueCompetitors} />
              <SeasonFact label="Clubs represented" value={statistics.clubs} />
              <SeasonFact label="Result entries" value={statistics.totalEntries} />
              <SeasonFact label="Fastest recorded time" value={formatNullableNumber(statistics.fastestRecordedTime, 2)} />
              <SeasonFact label="Most active competitor" value={statistics.mostActiveCompetitor ?? "N/A"} name />
            </dl>
          </div>
        </section>

        <main id="content" tabIndex={-1} className="dashboard-content">
          <section id="rankings" data-dashboard-section className="dashboard-section" aria-labelledby="rankings-title">
            <SectionHeading
              id="rankings-title"
              title="Season rankings"
              description="The competitor table responds to all four filters. Club rankings respond to the club selection; charts show full-season aggregates."
            />
            <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
              <TopCompetitors year={year} competitors={filteredTop5} onSelect={setSelectedCompetitor} />
              <Card className="club-panel">
                <CardTitle className="font-display text-3xl">Leading clubs</CardTitle>
                <CardDescription className="mt-1">
                  Power totals the top five member scores; strength compares average member performance.
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
                            aria-label={`View details for ${club.club}`}
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
                                    {club.members} members · {club.appearances} appearances
                                  </span>
                                </span>
                              </span>
                              <span className="shrink-0 text-right">
                                <span className="block font-display text-xl font-bold leading-none tabular-nums">
                                  {formatNumber(club.powerScore, 0)}
                                </span>
                                <span className="mt-1 block text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                                  Power
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
                    No clubs match the current club selection.
                  </p>
                )}
              </Card>
            </div>
          </section>

          <section id="analytics" data-dashboard-section className="dashboard-section" aria-labelledby="analytics-title">
            <SectionHeading
              id="analytics-title"
              title="Season analytics"
              description="Plots and comparisons show the complete season rather than changing with the ranking filters."
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <SectionChart title="Competitor performance matrix" description="Participation compared with performance score; podium count is represented by the plotted point size.">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 18, right: 20, bottom: 18, left: 0 }}>
                    <CartesianGrid stroke={gridStroke} />
                    <XAxis type="number" dataKey="x" stroke={axisStroke} name="Competitions" tick={{ fontSize: 11 }} />
                    <YAxis type="number" dataKey="y" stroke={axisStroke} name="Performance points" tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ strokeDasharray: "4 4" }} contentStyle={tooltipStyle} />
                    <Scatter data={eliteMatrix} fill={chartPalette[0]} />
                  </ScatterChart>
                </ResponsiveContainer>
              </SectionChart>
              <SectionChart title="Speed and consistency" description="Normalized speed score compared with consistency score for season competitors.">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 18, right: 20, bottom: 18, left: 0 }}>
                    <CartesianGrid stroke={gridStroke} />
                    <XAxis type="number" dataKey="x" stroke={axisStroke} name="Consistency" tick={{ fontSize: 11 }} />
                    <YAxis type="number" dataKey="y" stroke={axisStroke} name="Normalized speed" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Scatter data={speedVsConsistency} fill={chartPalette[1]} />
                  </ScatterChart>
                </ResponsiveContainer>
              </SectionChart>
              <SectionChart title="Division distribution" description="Competitor appearances by division, from normalized official results.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.divisions.slice(0, 8)} margin={{ top: 12, right: 8, bottom: 4, left: -18 }}>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="division" stroke={axisStroke} tick={{ fontSize: 11 }} />
                    <YAxis stroke={axisStroke} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="appearances" name="Appearances" radius={[2, 2, 0, 0]}>
                      {statistics.divisions.slice(0, 8).map((division, index) => (
                        <Cell key={division.division} fill={chartPalette[index % chartPalette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </SectionChart>
              <SectionChart title="Club strength comparison" description="Club power compared with average member strength.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.clubsRanking.slice(0, 6)} layout="vertical" margin={{ top: 8, right: 14, bottom: 4, left: 24 }}>
                    <CartesianGrid stroke={gridStroke} horizontal={false} />
                    <XAxis type="number" stroke={axisStroke} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="club" stroke={axisStroke} width={112} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend />
                    <Bar dataKey="powerScore" name="Club power" fill={chartPalette[0]} radius={[0, 2, 2, 0]} />
                    <Bar dataKey="strengthScore" name="Club strength" fill={chartPalette[1]} radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionChart>
            </div>
          </section>

          <section id="details" data-dashboard-section className="dashboard-section" aria-labelledby="details-title">
            <SectionHeading
              id="details-title"
              title="Competitor and club detail"
              description="Select a name in the season rankings to inspect its season record."
            />
            <div className="grid gap-8 xl:grid-cols-2">
              <Card>
                <CardTitle className="font-display text-3xl">{displayedCompetitor?.competitorName ?? "No competitor selected"}</CardTitle>
                <CardDescription className="mt-1">{displayedCompetitor?.club ?? "Club information unavailable"}</CardDescription>
                {displayedCompetitor ? (
                  <>
                    <dl className="metric-grid mt-6">
                      <MetricValue label="Overall score" value={formatNumber(displayedCompetitor.overallScore, 0)} />
                      <MetricValue label="Wins" value={displayedCompetitor.wins} />
                      <MetricValue label="Podiums" value={displayedCompetitor.podiums} />
                      <MetricValue label="Competitions" value={displayedCompetitor.uniqueCompetitions} />
                      <MetricValue label="Average placement" value={formatNullableNumber(displayedCompetitor.averagePlacement, 2)} />
                      <MetricValue label="Fastest time" value={formatNullableNumber(displayedCompetitor.fastestTime, 2)} />
                    </dl>
                    <div className="mt-7 h-[260px] min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={displayedCompetitor.placementsByDate} margin={{ top: 12, right: 12, bottom: 8, left: -18 }}>
                          <CartesianGrid stroke={gridStroke} vertical={false} />
                          <XAxis dataKey="date" stroke={axisStroke} tickFormatter={formatDate} tick={{ fontSize: 10 }} />
                          <YAxis reversed stroke={axisStroke} allowDecimals={false} domain={[1, "dataMax"]} tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={tooltipStyle} />
                          <Line
                            type="monotone"
                            dataKey="placement"
                            name="Placement"
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
                    Select a competitor from the ranking, or broaden the filters to find a season record.
                  </p>
                )}
              </Card>

              <Card>
                <CardTitle className="font-display text-3xl">{displayedClub?.club ?? "No club selected"}</CardTitle>
                <CardDescription className="mt-1">
                  {displayedClub ? `${displayedClub.members} members · ${displayedClub.appearances} appearances` : "Club metrics appear after results are normalized."}
                </CardDescription>
                {displayedClub ? (
                  <dl className="metric-grid mt-6">
                    <MetricValue label="Club power" value={formatNumber(displayedClub.powerScore, 0)} />
                    <MetricValue label="Club strength" value={formatNumber(displayedClub.strengthScore, 0)} />
                    <MetricValue label="Wins" value={displayedClub.wins} />
                    <MetricValue label="Podiums" value={displayedClub.podiums} />
                    <MetricValue label="Average placement" value={formatNullableNumber(displayedClub.averagePlacement, 2)} />
                    <MetricValue label="Top competitor" value={displayedClub.topCompetitor ?? "N/A"} />
                  </dl>
                ) : (
                  <p className="mt-5 text-sm text-[var(--ink-muted)]">
                    Select a club from the ranking, or broaden the current club selection.
                  </p>
                )}
              </Card>
            </div>
          </section>

          <section id="competitions" data-dashboard-section className="dashboard-section" aria-labelledby="competitions-title">
            <SectionHeading
              id="competitions-title"
              title={`${year} competition record`}
              description="Discovered IDPA competitions with the official calendar entries and available result PDFs."
              aside={
                <a className="source-link" href={competitionsFile.sourceUrl} target="_blank" rel="noreferrer">
                  Open MDLSZ calendar <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </a>
              }
            />
            <CompetitionTimeline competitions={statistics.competitions} />
          </section>

          <section id="insights" data-dashboard-section className="dashboard-section" aria-labelledby="insights-title">
            <SectionHeading
              id="insights-title"
              title="Season insights"
              description="Highlights are calculated from the normalized season results; unavailable values remain marked as N/A."
            />
            <Card className="editorial-panel">
              <dl className="insights-list">
                {[
                  ["The dominator", statistics.insights.dominator],
                  ["Speed leader", statistics.insights.speedDemon],
                  ["Most appearances", statistics.insights.ironman],
                  ["Most consistent", statistics.insights.mrConsistent],
                  ["Rising star", statistics.insights.risingStar],
                  ["Largest competition", statistics.insights.biggestCompetition],
                  ["Leading club", statistics.insights.strongestClub],
                  ["Podium leader", statistics.insights.podiumMachine],
                ].map(([label, value]) => (
                  <div key={String(label)} className="insight-entry">
                    <dt>{label}</dt>
                    <dd>{value ?? "N/A"}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                <Link href="/methodology" className="source-link">Scoring methodology</Link>
                <a className="source-link" href={competitionsFile.sourceUrl} target="_blank" rel="noreferrer">
                  Official MDLSZ calendar
                </a>
              </div>
            </Card>
          </section>

          <section id="data-quality" data-dashboard-section className="dashboard-section" aria-labelledby="quality-title">
            <SectionHeading
              id="quality-title"
              title="Data quality and traceability"
              description="Pipeline failures, incomplete source records, and normalization ambiguities remain visible."
            />
            {!!competitionsFile.errors.length && (
              <Card className="quality-warning mb-6">
                <CardTitle>Source access warnings</CardTitle>
                <CardDescription className="mt-1">The calendar could not be read cleanly for this season.</CardDescription>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {competitionsFile.errors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              </Card>
            )}
            {!!qualityFile.errors.length && (
              <Card className="quality-warning mb-6">
                <CardTitle>PDF processing warnings</CardTitle>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {qualityFile.errors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              </Card>
            )}
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <Card>
                <CardTitle className="font-display text-3xl">Processing quality</CardTitle>
                <CardDescription className="mt-1">Counts from this season&apos;s extraction and normalization run.</CardDescription>
                <dl className="quality-grid mt-5">
                  {Object.entries(qualityFile.quality).map(([label, value]) => (
                    <MetricValue key={label} label={label.replace(/([A-Z])/g, " $1")} value={formatNumber(value)} />
                  ))}
                </dl>
              </Card>
              <Card>
                <CardTitle className="font-display text-3xl">Results, linked back</CardTitle>
                <CardDescription className="mt-1">Season facts remain traceable to their official source records.</CardDescription>
                <dl className="quality-grid mt-5">
                  <MetricValue label="Competitions discovered" value={competitionsFile.discoveredCount} />
                  <MetricValue label="Normalized result rows" value={resultsFile.results.length} />
                  <MetricValue label="Rows with parsing issues" value={resultsFile.parsingErrors.length} />
                  <MetricValue label="Ambiguous competitor identities" value={resultsFile.ambiguousCompetitors.length} />
                </dl>
                <p className="mt-5 border-t border-[var(--rule)] pt-4 text-sm leading-6 text-[var(--ink-muted)]">
                  Raw times are not treated as cross-competition comparisons unless normalized against the fastest valid time within each competition.
                </p>
              </Card>
            </div>
          </section>
        </main>
        <SiteFooter year={year} />
      </div>
    </>
  );
}
