"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight } from "lucide-react";

import { SectionChart } from "@/components/charts/section-chart";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { axisStroke, chartPalette, gridStroke, tooltipStyle } from "@/lib/chart-theme";
import { methodologyPath } from "@/lib/discipline-paths";
import {
  rankSteelChallengeResults,
  type SteelChallengeCompetitionSummary,
  type SteelChallengeExcludedRow,
  type SteelChallengeLeaderboardEntry,
  type SteelChallengeStatistics,
} from "@/lib/steel-challenge-statistics";
import type { CompetitionDiscoveryFile, QualityFile } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

interface SteelChallengeDashboardProps {
  year: number;
  availableYears: number[];
  competitionsFile: CompetitionDiscoveryFile;
  qualityFile: QualityFile;
  statistics: SteelChallengeStatistics;
}

const exclusionLabels: Record<SteelChallengeExcludedRow["reason"], string> = {
  "unknown-competition": "A versenynaptárhoz nem kapcsolható sor",
  "missing-division": "Divízió nélküli sor",
  "missing-placement": "Hiányzó vagy érvénytelen helyezés",
};

function machineDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function SeasonFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="hero-ledger-item">
      <dt className="hero-ledger-label">{label}</dt>
      <dd className="hero-ledger-value">{typeof value === "number" ? formatNumber(value) : value}</dd>
    </div>
  );
}

function DivisionLeaderboard({
  entries,
  selectedKey,
  onSelect,
}: {
  entries: SteelChallengeLeaderboardEntry[];
  selectedKey: string | null;
  onSelect: (entry: SteelChallengeLeaderboardEntry) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = entries.slice(0, 3);
  const additional = entries.slice(3);

  const renderRows = (rows: SteelChallengeLeaderboardEntry[], offset: number) => rows.map((entry, index) => (
    <li key={entry.key} className="steel-rank-item">
      <button
        type="button"
        onClick={() => onSelect(entry)}
        aria-label={`${entry.competitorName} versenyzői adatlapja`}
        aria-pressed={selectedKey === entry.key}
        className="steel-rank-row"
      >
        <span className="steel-rank-identity">
          <span className={`rank-number ${offset + index < 3 ? "rank-number-podium" : ""}`}>{String(offset + index + 1).padStart(2, "0")}</span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-[var(--ink)]">{entry.competitorName}</span>
            <span className="block truncate text-xs text-[var(--ink-muted)]">{entry.club ?? "Nincs egyesületi adat"}</span>
          </span>
        </span>
        <span className="steel-rank-score">
          <strong>{formatNumber(entry.averagePercentile, 1)}%</strong>
          <span>percentilis · {entry.matchCount} verseny</span>
        </span>
        <span className="score-track" aria-hidden="true">
          <span style={{ width: `${Math.max(0, Math.min(entry.averagePercentile, 100))}%` }} />
        </span>
      </button>
    </li>
  ));

  if (!visible.length) {
    return (
      <p className="border-y border-[var(--rule)] py-8 text-sm text-[var(--ink-muted)]" role="status">
        A kiválasztott szűrőkkel ebben a divízióban nincs rangsorolható eredmény.
      </p>
    );
  }
  return (
    <>
      <ol className="steel-rank-list">{renderRows(visible, 0)}</ol>
      {additional.length > 0 ? (
        <details className="steel-rank-more" onToggle={(event) => setExpanded(event.currentTarget.open)}>
          <summary>Teljes mezőny megjelenítése <span>{formatNumber(additional.length)} további versenyző</span></summary>
          {expanded ? <ol className="steel-rank-list">{renderRows(additional, visible.length)}</ol> : null}
        </details>
      ) : null}
    </>
  );
}

function CompetitorProfile({
  entry,
  competitionsById,
}: {
  entry: SteelChallengeLeaderboardEntry | null;
  competitionsById: Map<string, SteelChallengeCompetitionSummary>;
}) {
  return (
    <Card>
      <CardTitle className="font-display text-3xl">{entry?.competitorName ?? "Nincs kiválasztott versenyző"}</CardTitle>
      <CardDescription className="mt-1">
        {entry ? `${entry.division} · ${entry.club ?? "Nincs egyesületi adat"}` : "Válasszon versenyzőt a divíziórangsorból."}
      </CardDescription>
      {entry ? (
        <>
          <dl className="metric-grid mt-6">
            <div className="metric-value"><dt className="editorial-kicker">Átlagos helyezési percentilis</dt><dd>{formatNumber(entry.averagePercentile, 2)}%</dd></div>
            <div className="metric-value"><dt className="editorial-kicker">Értékelhető versenyek</dt><dd>{formatNumber(entry.matchCount)}</dd></div>
            <div className="metric-value"><dt className="editorial-kicker">Átlagos hivatalos helyezés</dt><dd>{formatNumber(entry.averagePlacement, 2)}.</dd></div>
            <div className="metric-value"><dt className="editorial-kicker">Győzelmek / dobogók</dt><dd>{entry.wins} / {entry.podiums}</dd></div>
          </dl>
          <div className="mt-7 overflow-x-auto border-t border-[var(--rule)]">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <caption className="sr-only">A versenyző eredményei a kiválasztott divízióban</caption>
              <thead>
                <tr className="border-b border-[var(--rule)] text-xs uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                  <th scope="col" className="py-3 pr-4 font-semibold">Verseny</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Helyezés</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Mezőnyméret</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Percentilis</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Közölt érték</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Győzteshez mérve</th>
                  <th scope="col" className="py-3 font-semibold">Forrás</th>
                </tr>
              </thead>
              <tbody>
                {entry.results.map((result) => {
                  const competition = competitionsById.get(result.competitionId);
                  if (!competition) throw new Error(`Missing Steel Challenge competition ${result.competitionId}.`);
                  return (
                    <tr key={`${result.competitionId}-${result.division}-${result.competitorKey}`} className="border-b border-[var(--rule)]">
                      <td className="py-3 pr-4">
                        <span className="block font-medium text-[var(--ink)]">{competition.name}</span>
                        <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">
                          <time dateTime={machineDate(competition.date)}>{formatDate(competition.date)}</time> · {competition.level || "Nincs szintadat"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 tabular-nums">{result.placement}.</td>
                      <td className="py-3 pr-4 tabular-nums">{result.fieldSize}</td>
                      <td className="py-3 pr-4 tabular-nums">{formatNumber(result.percentile, 1)}%</td>
                      <td className="py-3 pr-4 tabular-nums">{result.rawResult ?? "Nincs adat"}</td>
                      <td className="py-3 pr-4 tabular-nums">{result.winnerShare === null ? "–" : `${formatNumber(result.winnerShare, 1)}%`}</td>
                      <td className="py-3">
                        <a href={competition.resultPdfUrl ?? competition.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
                          Eredmény <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
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

export function SteelChallengeDashboard({
  year,
  availableYears,
  competitionsFile,
  qualityFile,
  statistics,
}: SteelChallengeDashboardProps) {
  const [competitionFilter, setCompetitionFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [clubFilter, setClubFilter] = useState("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const divisionOptions = useMemo(() => ["all", ...statistics.divisions.map(({ value }) => value)], [statistics.divisions]);
  const clubOptions = useMemo(
    () => ["all", ...[...new Set(statistics.fieldResults.map(({ club }) => club).filter((club): club is string => Boolean(club)))].sort((a, b) => a.localeCompare(b, "hu"))],
    [statistics.fieldResults],
  );

  const filteredLeaderboard = useMemo(
    () => rankSteelChallengeResults(statistics.fieldResults.filter((result) =>
      (competitionFilter === "all" || result.competitionId === competitionFilter)
      && (divisionFilter === "all" || result.division === divisionFilter)
      && (clubFilter === "all" || result.club === clubFilter),
    )),
    [statistics.fieldResults, competitionFilter, divisionFilter, clubFilter],
  );

  const divisionsToShow = (divisionFilter === "all" ? statistics.divisions.map(({ value }) => value) : [divisionFilter])
    .filter((division) => filteredLeaderboard.some((entry) => entry.division === division));
  const selectedEntry = filteredLeaderboard.find((entry) => entry.key === selectedKey) ?? filteredLeaderboard[0] ?? null;
  const competitionsById = useMemo(
    () => new Map(statistics.competitions.map((competition) => [competition.id, competition])),
    [statistics.competitions],
  );

  const competitionChart = statistics.competitions
    .filter((competition) => competition.rankedRows > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((competition) => ({
      id: competition.id,
      name: competition.name.length > 24 ? `${competition.name.slice(0, 22)}…` : competition.name,
      fullName: competition.name,
      results: competition.rankedRows,
    }));

  const placementTrend = selectedEntry?.results.map((result) => {
    const competition = competitionsById.get(result.competitionId);
    if (!competition) throw new Error(`Missing Steel Challenge competition ${result.competitionId}.`);
    return {
      date: competition.date,
      shortDate: formatDate(competition.date),
      placement: result.placement,
    };
  }) ?? [];

  const exclusionGroups = [...statistics.excludedRows.reduce((groups, row) => {
    const key = `${row.reason}\u0000${row.competitionId}`;
    const group = groups.get(key) ?? { ...row, rows: 0 };
    group.rows += 1;
    groups.set(key, group);
    return groups;
  }, new Map<string, SteelChallengeExcludedRow & { rows: number }>()).values()];

  return (
    <>
      <div className="steel-dashboard">
        <DashboardHeader
          disciplineSlug="steel-challenge"
          disciplineName="Steel Challenge"
          year={year}
          availableYears={availableYears}
          competitionOptions={statistics.competitions.filter(({ rankedRows }) => rankedRows > 0).map(({ id, name }) => ({ id, name }))}
          divisionOptions={divisionOptions}
          clubOptions={clubOptions}
          competition={competitionFilter}
          division={divisionFilter}
          club={clubFilter}
          onCompetitionChange={setCompetitionFilter}
          onDivisionChange={setDivisionFilter}
          onClubChange={setClubFilter}
          sectionLabels={{ analytics: "Benchmark", details: "Versenyző", competitions: "Archívum" }}
        />

        <div className="dashboard-main steel-reticle">
          <section id="overview" data-dashboard-section aria-labelledby="overview-title" className="season-hero steel-hero">
            <div className="season-hero-inner steel-hero-inner">
              <div className="steel-hero-copy">
                <div className="steel-hero-status">
                  <span className="steel-status-chip"><span className="steel-status-dot" /> MDLSZ / EREDMÉNYARCHÍVUM</span>
                  <span className="steel-status-chip steel-status-chip-season">SZEZON {year}</span>
                </div>
                <h1 id="overview-title" className="hero-title steel-hero-title">
                  Steel Challenge <span className="steel-title-accent">szakág</span>
                  <span className="hero-title-year">{year}. évi szezon</span>
                </h1>
                <p className="hero-description">
                  Helyezésalapú szezonrangsorok és versenytelemetria. Minden összehasonlítás azonos verseny és divízió mezőnyén belül készül, hivatalos eredményforrásokra visszavezetve.
                </p>
                <div className="hero-source-line steel-source-line">
                  <span>Adatfrissítés: {competitionsFile.generatedAt ? formatDate(competitionsFile.generatedAt) : "a dátum nem ismert"}</span>
                  <span>Értékelhető mezők: {formatNumber(statistics.rankedFields)}</span>
                  <a href={methodologyPath("steel-challenge")} className="source-link">Módszertan</a>
                </div>
              </div>
              <dl className="hero-ledger steel-hero-ledger" aria-label={`${year}. évi Steel Challenge szezonadatok`}>
                <SeasonFact label="Versenyek" value={statistics.competitionCount} />
                <SeasonFact label="Eredménnyel" value={statistics.competitionsWithResults} />
                <SeasonFact label="Értékelhető sorok" value={statistics.rankedRows} />
                <SeasonFact label="Rangsorolt versenyzők" value={statistics.rankedCompetitors} />
                <SeasonFact label="Divíziók" value={statistics.divisions.length} />
                <SeasonFact label="Egyesületek" value={statistics.representedClubs} />
              </dl>
            </div>
          </section>

          <main id="content" tabIndex={-1} className="dashboard-content steel-content">
            <section id="rankings" data-dashboard-section className="dashboard-section" aria-labelledby="rankings-title">
              <SectionHeading
                id="rankings-title"
                title="Hivatalos Steel Challenge kategóriák"
                description="A rangsorokat divíziónként, azonos versenyen elért hivatalos helyezések percentiliseiből számítjuk."
                aside={<span className="steel-section-count">{formatNumber(statistics.divisions.length)} rangsorolt divízió</span>}
              />
              <div className="steel-division-grid">
                {divisionsToShow.map((division) => {
                  const entries = filteredLeaderboard.filter((entry) => entry.division === division);
                  const comparableFields = new Set(
                    statistics.fieldResults.filter((result) => result.division === division).map((result) => result.competitionId),
                  ).size;
                  return (
                    <Card key={division} className="steel-division-card">
                      <div className="steel-division-heading">
                        <div className="min-w-0">
                          <span className="steel-division-code">DIVÍZIÓ // {comparableFields} ÖSSZEHASONLÍTHATÓ MEZŐ</span>
                          <CardTitle className="mt-2 steel-division-title">{division}</CardTitle>
                        </div>
                        <span className="steel-division-entrants">{formatNumber(entries.length)}<small>versenyző</small></span>
                      </div>
                      <DivisionLeaderboard
                        entries={entries}
                        selectedKey={selectedEntry?.key ?? null}
                        onSelect={(entry) => setSelectedKey(entry.key)}
                      />
                    </Card>
                  );
                })}
                {!divisionsToShow.length && (
                  <p className="border-y border-[var(--rule)] py-8 text-sm text-[var(--ink-muted)]" role="status">
                    A kiválasztott szűrőkkel nincs megjeleníthető divízió.
                  </p>
                )}
              </div>
            </section>

            <section id="analytics" data-dashboard-section className="dashboard-section" aria-labelledby="analytics-title">
              <SectionHeading
                id="analytics-title"
                title="Szezonbenchmark"
                description="Versenyterhelés és divíziónkénti részvétel az értékelhető eredménysorok alapján."
              />
              <div className="grid gap-5 xl:grid-cols-2">
                <SectionChart title="Értékelhető eredménysorok versenyenként" description="A rangsorba bevont sorok száma, időrendben.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={competitionChart} margin={{ top: 10, right: 12, left: -18, bottom: 6 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisStroke }} interval={0} angle={-28} textAnchor="end" height={64} />
                      <YAxis tick={{ fontSize: 11, fill: axisStroke }} allowDecimals={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatNumber(Number(value)), "Eredménysor"]} labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName ?? String(label)} />
                      <Bar dataKey="results" radius={[4, 4, 0, 0]}>
                        {competitionChart.map((entry, index) => (
                          <Cell key={entry.id} fill={chartPalette[index % chartPalette.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </SectionChart>

                <SectionChart title="Divíziónkénti részvétel" description="A legtöbb rangsorolt eredménysort tartalmazó nyolc divízió.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statistics.divisions.slice(0, 8).map((entry) => ({ ...entry, shortName: entry.value.length > 20 ? `${entry.value.slice(0, 18)}…` : entry.value }))}
                      layout="vertical"
                      margin={{ top: 8, right: 18, left: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: axisStroke }} allowDecimals={false} />
                      <YAxis type="category" dataKey="shortName" width={160} tick={{ fontSize: 11, fill: axisStroke }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatNumber(Number(value)), "Eredménysor"]} labelFormatter={(label, payload) => payload?.[0]?.payload?.value ?? String(label)} />
                      <Bar dataKey="entries" radius={[0, 4, 4, 0]}>
                        {statistics.divisions.slice(0, 8).map((entry, index) => (
                          <Cell key={entry.value} fill={chartPalette[index % chartPalette.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </SectionChart>
              </div>
            </section>
            <section id="details" data-dashboard-section className="dashboard-section" aria-labelledby="details-title">
              <SectionHeading
                id="details-title"
                title="Versenyzői telemetria"
                description="A divíziórangsorból kiválasztott versenyző helyezései, percentilisei és hivatalos forrásai."
              />
              <CompetitorProfile entry={selectedEntry} competitionsById={competitionsById} />
            </section>
            <section id="competitions" data-dashboard-section className="dashboard-section" aria-labelledby="competitions-title">
              <SectionHeading
                id="competitions-title"
                title={`${year}-os Steel Challenge versenyek`}
                description="A versenynaptár rögzített eseményei, feldolgozott eredménysorokkal és hivatalos forrásokkal."
                aside={<span className="steel-section-count">{formatNumber(statistics.competitionsWithResults)} verseny eredménnyel</span>}
              />
              <div className="steel-archive">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <caption className="sr-only">{year}. évi Steel Challenge versenyek és hivatalos eredményforrások</caption>
                    <thead>
                      <tr>
                        <th scope="col">Dátum / helyszín</th>
                        <th scope="col">Verseny</th>
                        <th scope="col">Szint</th>
                        <th scope="col">Eredménysor</th>
                        <th scope="col">Divízió</th>
                        <th scope="col" className="text-right">Forrás</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistics.competitions.map((competition) => (
                        <tr key={competition.id}>
                          <td>
                            <time dateTime={machineDate(competition.date)}>{formatDate(competition.date)}</time>
                            <span className="steel-table-secondary">{competition.location ?? "A helyszín nem ismert"}</span>
                          </td>
                          <td className="font-semibold">{competition.name}</td>
                          <td>{competition.level || "Nincs szintadat"}</td>
                          <td className="tabular-nums">{formatNumber(competition.rankedRows)}</td>
                          <td className="tabular-nums">{formatNumber(competition.divisions.length)}</td>
                          <td className="text-right">
                            <div className="flex justify-end gap-3">
                              <a href={competition.sourceUrl} target="_blank" rel="noreferrer" className="source-link" aria-label={`${competition.name} hivatalos versenyadatai`}>
                                Naptár <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                              </a>
                              {competition.resultPdfUrl ? (
                                <a href={competition.resultPdfUrl} target="_blank" rel="noreferrer" className="source-link" aria-label={`${competition.name} eredményjegyzéke`}>
                                  PDF <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                                </a>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
            <section id="insights" data-dashboard-section className="dashboard-section" aria-labelledby="insights-title">
              <SectionHeading
                id="insights-title"
                title="Szezonkiemelések"
                description="A teljes szezon adatain alapuló részvételi és bajnoki mutatók."
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="steel-insight-card">
                  <span className="steel-insight-label">LEGNAGYOBB MEZŐNY</span>
                  <CardTitle className="mt-3">{statistics.largestField ? formatNumber(statistics.largestField.size) : "–"}<small> versenyző</small></CardTitle>
                  <CardDescription className="mt-2">
                    {statistics.largestField ? `${statistics.largestField.competitionName} · ${statistics.largestField.division}` : "Nincs összehasonlítható mezőny"}
                  </CardDescription>
                </Card>
                <Card className="steel-insight-card">
                  <span className="steel-insight-label">LEGAKTÍVABB VERSENYZŐ</span>
                  <CardTitle className="mt-3">{statistics.mostActive?.name ?? "Nincs adat"}</CardTitle>
                  <CardDescription className="mt-2">{statistics.mostActive ? `${formatNumber(statistics.mostActive.competitions)} versenyen indult` : "A szezonban nincs rangsorolt eredmény"}</CardDescription>
                </Card>
                <Card className="steel-insight-card">
                  <span className="steel-insight-label">LEGSOKOLDALÚBB VERSENYZŐ</span>
                  <CardTitle className="mt-3">{statistics.mostVersatile?.name ?? "Nincs adat"}</CardTitle>
                  <CardDescription className="mt-2">{statistics.mostVersatile ? `${formatNumber(statistics.mostVersatile.divisions)} divízióban szerepel` : "A szezonban nincs rangsorolt eredmény"}</CardDescription>
                </Card>
                <Card className="steel-insight-card">
                  <span className="steel-insight-label">ORSZÁGOS BAJNOKSÁGI GYŐZELMEK</span>
                  <CardTitle className="mt-3">{formatNumber(statistics.championshipWinners.length)}<small> eredménysor</small></CardTitle>
                  <CardDescription className="mt-2">Hivatalos 1. helyezések az OB szintű versenyeken.</CardDescription>
                </Card>
              </div>
              {selectedEntry && placementTrend.length > 1 ? (
                <div className="mt-6">
                  <SectionChart
                    title={`${selectedEntry.competitorName} helyezései időrendben`}
                    description="Alacsonyabb érték jobb helyezést jelent."
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={placementTrend} margin={{ top: 10, right: 16, left: -10, bottom: 6 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                        <XAxis dataKey="shortDate" tick={{ fontSize: 11, fill: axisStroke }} />
                        <YAxis tick={{ fontSize: 11, fill: axisStroke }} allowDecimals={false} reversed domain={["dataMin - 1", "dataMax + 1"]} />
                        <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${formatNumber(Number(value))}.`, "Helyezés"]} labelFormatter={(label, payload) => payload?.[0]?.payload?.date ? formatDate(payload[0].payload.date) : String(label)} />
                        <Line type="monotone" dataKey="placement" stroke={chartPalette[0]} strokeWidth={2.4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </SectionChart>
                </div>
              ) : null}
            </section>
            <section id="data-quality" data-dashboard-section className="dashboard-section" aria-labelledby="quality-title">
              <SectionHeading
                id="quality-title"
                title="Adatminőség és rangsorkizárások"
                description="A rangsorba nem kerülő forrássorok és a PDF-feldolgozás diagnosztikái."
              />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card className="steel-quality-stat"><CardTitle>Feldolgozott sorok</CardTitle><p>{formatNumber(statistics.resultRows)}</p></Card>
                <Card className="steel-quality-stat"><CardTitle>Rangsorolt sorok</CardTitle><p>{formatNumber(statistics.rankedRows)}</p></Card>
                <Card className="steel-quality-stat"><CardTitle>Kizárt sorok</CardTitle><p>{formatNumber(statistics.excludedRows.length)}</p></Card>
                <Card className="steel-quality-stat"><CardTitle>Nyers értékkel rendelkező sorok</CardTitle><p>{formatNumber(statistics.resultsWithRawValue)}</p></Card>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                <Card className="steel-report-panel">
                  <CardTitle>Kizárási csoportok</CardTitle>
                  <CardDescription className="mt-1">A rangsorból technikai okok miatt kimaradó sorok.</CardDescription>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                      <thead>
                        <tr>
                          <th scope="col">Ok</th>
                          <th scope="col">Verseny</th>
                          <th scope="col">Divízió</th>
                          <th scope="col">Sorok</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exclusionGroups.slice(0, 20).map((group) => (
                          <tr key={`${group.reason}-${group.competitionId}-${group.division ?? "none"}`}>
                            <td>{exclusionLabels[group.reason]}</td>
                            <td>{group.competitionName}</td>
                            <td>{group.division ?? "Nincs adat"}</td>
                            <td className="tabular-nums">{formatNumber(group.rows)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!exclusionGroups.length && <p className="py-6 text-sm text-[var(--ink-muted)]">Nem találtunk rangsorból kizárt sort.</p>}
                  </div>
                </Card>

                <Card className="steel-report-panel">
                  <CardTitle>Feldolgozási diagnosztikák</CardTitle>
                  <CardDescription className="mt-1">A PDF-feldolgozás közben rögzített hibák és figyelmeztetések.</CardDescription>
                  {competitionsFile.errors.length || qualityFile.errors.length ? (
                    <ul className="mt-4 space-y-2 pl-5 text-sm text-[var(--ink-muted)]">
                      {[...competitionsFile.errors, ...qualityFile.errors].map((error, index) => (
                        <li key={`${index}-${error}`} className="list-disc">{error}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-[var(--ink-muted)]">A feldolgozás hibajelzés nélkül futott végig.</p>
                  )}
                </Card>
              </div>
            </section>
          </main>
        </div>

        <SiteFooter disciplineSlug="steel-challenge" year={year} />
      </div>
    </>
  );
}
