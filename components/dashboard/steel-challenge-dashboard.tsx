"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight } from "lucide-react";

import { SectionChart } from "@/components/charts/section-chart";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { methodologyPath } from "@/lib/discipline-paths";
import {
  rankSteelChallengeResults,
  type SteelChallengeExcludedRow,
  type SteelChallengeLeaderboardEntry,
  type SteelChallengeStatistics,
} from "@/lib/steel-challenge-statistics";
import type { CompetitionDiscoveryFile, QualityFile, ResultsFile } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

interface SteelChallengeDashboardProps {
  year: number;
  availableYears: number[];
  competitionsFile: CompetitionDiscoveryFile;
  resultsFile: ResultsFile;
  qualityFile: QualityFile;
  statistics: SteelChallengeStatistics;
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
  const visible = entries.slice(0, 10);
  if (!visible.length) {
    return (
      <p className="border-y border-[var(--rule)] py-8 text-sm text-[var(--ink-muted)]" role="status">
        A kiválasztott szűrőkkel ebben a divízióban nincs rangsorolható eredmény.
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
                <span className={`rank-number ${index < 3 ? "rank-number-podium" : ""}`}>{String(index + 1).padStart(2, "0")}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-[var(--ink)]">{entry.competitorName}</span>
                  <span className="mt-0.5 block truncate text-sm text-[var(--ink-muted)]">{entry.club ?? "Nincs egyesületi adat"}</span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-display text-2xl font-bold leading-none tabular-nums">{formatNumber(entry.averagePercentile, 1)}%</span>
                <span className="mt-1 block max-w-[8.5rem] text-xs font-semibold uppercase leading-tight tracking-[0.1em] text-[var(--ink-muted)] sm:max-w-none">Átlagos helyezési percentilis</span>
              </span>
            </span>
            <span className="score-track mt-3 block" aria-hidden="true">
              <span style={{ width: `${Math.max(0, Math.min(entry.averagePercentile, 100))}%` }} />
            </span>
            <span className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[var(--ink-muted)] sm:grid-cols-5">
              <span>Verseny <strong className="text-[var(--ink)]">{entry.matchCount}</strong></span>
              <span>Győzelem <strong className="text-[var(--ink)]">{entry.wins}</strong></span>
              <span>Dobogó <strong className="text-[var(--ink)]">{entry.podiums}</strong></span>
              <span>Legjobb helyezés <strong className="text-[var(--ink)]">{entry.bestPlacement}.</strong></span>
              <span>Legjobb közölt érték <strong className="text-[var(--ink)]">{entry.bestResult === undefined ? "–" : formatNumber(entry.bestResult, 2)}</strong></span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function CompetitorProfile({ entry }: { entry: SteelChallengeLeaderboardEntry | null }) {
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
                {entry.results.map((result) => (
                  <tr key={`${result.competitionId}-${result.division}-${result.competitorKey}`} className="border-b border-[var(--rule)]">
                    <td className="py-3 pr-4">
                      <span className="block font-medium text-[var(--ink)]">{result.competitionName}</span>
                      <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">
                        <time dateTime={machineDate(result.competitionDate)}>{formatDate(result.competitionDate)}</time> · {result.competitionLevel}
                      </span>
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{result.placement}.</td>
                    <td className="py-3 pr-4 tabular-nums">{result.fieldSize}</td>
                    <td className="py-3 pr-4 tabular-nums">{formatNumber(result.percentile, 1)}%</td>
                    <td className="py-3 pr-4 tabular-nums">{result.rawResult ?? "Nincs adat"}</td>
                    <td className="py-3 pr-4 tabular-nums">{result.winnerShare === null ? "–" : `${formatNumber(result.winnerShare, 1)}%`}</td>
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

export function SteelChallengeDashboard({
  year,
  availableYears,
  competitionsFile,
  resultsFile,
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

  const competitionChart = statistics.competitions
    .filter((competition) => competition.rankedRows > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((competition) => ({
      id: competition.id,
      name: competition.name.length > 24 ? `${competition.name.slice(0, 22)}…` : competition.name,
      fullName: competition.name,
      results: competition.rankedRows,
    }));

  const placementTrend = selectedEntry?.results.map((result) => ({
    date: result.competitionDate,
    shortDate: formatDate(result.competitionDate),
    placement: result.placement,
  })) ?? [];

  const exclusionGroups = [...statistics.excludedRows.reduce((groups, row) => {
    const key = `${row.reason}\u0000${row.competitionId}`;
    const group = groups.get(key) ?? { ...row, rows: 0 };
    group.rows += 1;
    groups.set(key, group);
    return groups;
  }, new Map<string, SteelChallengeExcludedRow & { rows: number }>()).values()];

  return (
    <>
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
      />

      <div className="dashboard-main">
        <section id="overview" data-dashboard-section aria-labelledby="overview-title" className="season-hero">
          <div className="season-hero-inner">
            <div>
              <h1 id="overview-title" className="hero-title">
                Steel Challenge
                <span className="hero-title-year">{year}. évi szezon</span>
              </h1>
              <p className="hero-description">
                Divíziónként elkülönített szezonrangsorok az MDLSZ hivatalos helyezései alapján. Az azonos versenyben és
                divízióban elért helyezésekből számítunk percentilist, így a különböző versenyek mezőnymérete összehasonlítható.
              </p>
              <div className="hero-source-line">
                <span>Adatfrissítés: {competitionsFile.generatedAt ? formatDate(competitionsFile.generatedAt) : "a dátum nem ismert"}</span>
                <span>Összehasonlítható verseny-divízió mezők: {formatNumber(statistics.rankedFields)}</span>
                <a href={methodologyPath("steel-challenge")} className="source-link">A rangsor módszertana</a>
              </div>
            </div>
            <dl className="hero-ledger" aria-label={`A ${year}. évi Steel Challenge szezon összesített mutatói`}>
              <SeasonFact label="Versenyek a naptárban" value={statistics.competitionCount} />
              <SeasonFact label="Versenyek eredménnyel" value={statistics.competitionsWithResults} />
              <SeasonFact label="Értékelhető eredménysorok" value={statistics.rankedRows} />
              <SeasonFact label="Egyedi versenyzők (rangsorban)" value={statistics.rankedCompetitors} />
              <SeasonFact label="Divíziók (rangsorban)" value={statistics.divisions.length} />
              <SeasonFact label="Képviselt egyesületek" value={statistics.representedClubs} />
            </dl>
          </div>
        </section>

        <main id="content" tabIndex={-1} className="dashboard-content">
          <section id="rankings" data-dashboard-section className="dashboard-section" aria-labelledby="rankings-title">
            <SectionHeading
              id="rankings-title"
              title="Divíziórangsorok"
              description="A rangsorok csak azonos versenyen és azonos divízióban elért hivatalos helyezéseket hasonlítanak össze."
            />
            <div className="space-y-7">
              {divisionsToShow.map((division) => (
                <Card key={division}>
                  <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <CardTitle>{division}</CardTitle>
                      <CardDescription className="mt-1">
                        {formatNumber(filteredLeaderboard.filter((entry) => entry.division === division).length)} rangsorolt versenyző
                      </CardDescription>
                    </div>
                  </div>
                  <DivisionLeaderboard
                    entries={filteredLeaderboard.filter((entry) => entry.division === division)}
                    selectedKey={selectedEntry?.key ?? null}
                    onSelect={(entry) => setSelectedKey(entry.key)}
                  />
                </Card>
              ))}
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
              title="Szezonstatisztikák"
              description="Versenyterhelés, divízióeloszlás és szintmegoszlás az értékelhető eredménysorokra vetítve."
            />
            <div className="grid gap-5 xl:grid-cols-2">
              <SectionChart title="Értékelhető eredménysorok versenyenként" description="A sorok száma versenyenként, időrendben.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={competitionChart} margin={{ top: 10, right: 12, left: -18, bottom: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: axisStroke }} interval={0} angle={-28} textAnchor="end" height={64} />
                    <YAxis tick={{ fontSize: 11, fill: axisStroke }} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatNumber(Number(value)), "Eredménysor"]} labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName ?? String(label)} />
                    <Bar dataKey="results" radius={[5, 5, 0, 0]}>
                      {competitionChart.map((entry, index) => (
                        <Cell key={entry.id} fill={chartPalette[index % chartPalette.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </SectionChart>

              <SectionChart title="Divíziók részaránya" description="A legtöbb rangsorolt eredménysort adó nyolc divízió.">
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
                    <Bar dataKey="entries" radius={[0, 5, 5, 0]}>
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
              title="Versenyzői adatlap"
              description="A kiválasztott versenyző divízión belüli eredményei, hivatalos helyezései és forrásai."
            />
            <CompetitorProfile entry={selectedEntry} />
          </section>

          <section id="competitions" data-dashboard-section className="dashboard-section" aria-labelledby="competitions-title">
            <SectionHeading
              id="competitions-title"
              title={`${year}. évi versenyek`}
              description="A versenynaptár eseményei, feldolgozott eredménysorokkal és forráslinkekkel."
            />
            <ol className="competition-list">
              {statistics.competitions.map((competition) => (
                <li key={competition.id} className="competition-entry">
                  <div className="competition-date">
                    <time dateTime={machineDate(competition.date)}>{formatDate(competition.date)}</time>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="competition-name">{competition.name}</h3>
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">
                      {(competition.level || "Nincs szintadat")}
                      {competition.location ? ` · ${competition.location}` : ""}
                    </p>
                    <dl className="competition-facts">
                      <div><dt>Eredménysorok</dt><dd>{formatNumber(competition.resultRows)}</dd></div>
                      <div><dt>Rangsorolt sorok</dt><dd>{formatNumber(competition.rankedRows)}</dd></div>
                      <div><dt>Divíziók</dt><dd>{competition.divisions.length ? competition.divisions.join(", ") : "Nincs adat"}</dd></div>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      <a href={competition.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
                        Hivatalos versenyadatok <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                      </a>
                      {competition.resultPdfUrl ? (
                        <a href={competition.resultPdfUrl} target="_blank" rel="noreferrer" className="source-link">
                          Eredményjegyzék <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="insights" data-dashboard-section className="dashboard-section" aria-labelledby="insights-title">
            <SectionHeading
              id="insights-title"
              title="Szezonkiemelések"
              description="A teljes szezon adataiból számolt legfontosabb Steel Challenge mutatók."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardTitle>Legnagyobb mezőny</CardTitle>
                <CardDescription className="mt-1">
                  {statistics.largestField
                    ? `${statistics.largestField.competitionName} · ${statistics.largestField.division}`
                    : "Nincs összehasonlítható mezőny"}
                </CardDescription>
                <p className="mt-5 text-3xl font-semibold tabular-nums text-[var(--ink)]">{statistics.largestField ? formatNumber(statistics.largestField.size) : "–"}</p>
              </Card>
              <Card>
                <CardTitle>Legaktívabb versenyző</CardTitle>
                <CardDescription className="mt-1">{statistics.mostActive?.name ?? "Nincs adat"}</CardDescription>
                <p className="mt-5 text-3xl font-semibold tabular-nums text-[var(--ink)]">{statistics.mostActive ? formatNumber(statistics.mostActive.competitions) : "–"}</p>
              </Card>
              <Card>
                <CardTitle>Legsokoldalúbb versenyző</CardTitle>
                <CardDescription className="mt-1">{statistics.mostVersatile?.name ?? "Nincs adat"}</CardDescription>
                <p className="mt-5 text-3xl font-semibold tabular-nums text-[var(--ink)]">{statistics.mostVersatile ? formatNumber(statistics.mostVersatile.divisions) : "–"}</p>
              </Card>
              <Card>
                <CardTitle>OB divíziógyőztesek</CardTitle>
                <CardDescription className="mt-1">Országos bajnokság szintű versenyeken</CardDescription>
                <p className="mt-5 text-3xl font-semibold tabular-nums text-[var(--ink)]">{formatNumber(statistics.championshipWinners.length)}</p>
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
                      <Line type="monotone" dataKey="placement" stroke="#a82e2c" strokeWidth={2.4} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </SectionChart>
              </div>
            ) : null}
          </section>

          <section id="data-quality" data-dashboard-section className="dashboard-section" aria-labelledby="quality-title">
            <SectionHeading
              id="quality-title"
              title="Adatminőség és kizárások"
              description="A rangsorba nem kerülő sorok és a feldolgozási diagnosztikák transzparens összefoglalása."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card><CardTitle>Feldolgozott sorok</CardTitle><p className="mt-4 text-3xl font-semibold tabular-nums text-[var(--ink)]">{formatNumber(resultsFile.results.length)}</p></Card>
              <Card><CardTitle>Rangsorolt sorok</CardTitle><p className="mt-4 text-3xl font-semibold tabular-nums text-[var(--ink)]">{formatNumber(statistics.rankedRows)}</p></Card>
              <Card><CardTitle>Kizárt sorok</CardTitle><p className="mt-4 text-3xl font-semibold tabular-nums text-[var(--ink)]">{formatNumber(statistics.excludedRows.length)}</p></Card>
              <Card><CardTitle>Nyers értékkel rendelkező sorok</CardTitle><p className="mt-4 text-3xl font-semibold tabular-nums text-[var(--ink)]">{formatNumber(statistics.resultsWithRawValue)}</p></Card>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-2">
              <Card>
                <CardTitle>Kizárási csoportok</CardTitle>
                <CardDescription className="mt-1">A rangsorból technikai okok miatt kimaradó sorok.</CardDescription>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--rule)] text-xs uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                        <th scope="col" className="py-3 pr-4 font-semibold">Ok</th>
                        <th scope="col" className="py-3 pr-4 font-semibold">Verseny</th>
                        <th scope="col" className="py-3 pr-4 font-semibold">Divízió</th>
                        <th scope="col" className="py-3 font-semibold">Sorok</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exclusionGroups.slice(0, 20).map((group) => (
                        <tr key={`${group.reason}-${group.competitionId}-${group.division ?? "none"}`} className="border-b border-[var(--rule)]">
                          <td className="py-3 pr-4">{exclusionLabels[group.reason]}</td>
                          <td className="py-3 pr-4">{group.competitionName}</td>
                          <td className="py-3 pr-4">{group.division ?? "Nincs adat"}</td>
                          <td className="py-3 tabular-nums">{formatNumber(group.rows)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!exclusionGroups.length && <p className="py-6 text-sm text-[var(--ink-muted)]">Nem találtunk rangsorból kizárt sort.</p>}
                </div>
              </Card>

              <Card>
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
    </>
  );
}
