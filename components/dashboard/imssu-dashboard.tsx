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
  rankImssuResults,
  type ImssuExcludedRow,
  type ImssuLeaderboardEntry,
  type ImssuStatistics,
} from "@/lib/imssu-statistics";
import type { CompetitionDiscoveryFile, QualityFile, ResultsFile } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

interface ImssuDashboardProps {
  year: number;
  availableYears: number[];
  competitionsFile: CompetitionDiscoveryFile;
  resultsFile: ResultsFile;
  qualityFile: QualityFile;
  statistics: ImssuStatistics;
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

const exclusionLabels: Record<ImssuExcludedRow["reason"], string> = {
  "unknown-competition": "A versenynaptárhoz nem kapcsolható sor",
  "missing-division": "Divízió nélküli sor (a dokumentum nem eredménytáblának tűnik)",
  "missing-hits": "Hiányzó vagy nem egész számú találatszám",
  "possible-column-shift": "Üres Eredmény, a Megjegyzés oszlopban szám – lehetséges oszlopeltolódás",
};

function machineDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function SeasonFact({ label, value }: { label: string; value: number }) {
  return (
    <div className="hero-ledger-item">
      <dt className="hero-ledger-label">{label}</dt>
      <dd className="hero-ledger-value">{formatNumber(value)}</dd>
    </div>
  );
}

function DivisionLeaderboard({
  entries,
  selectedKey,
  onSelect,
}: {
  entries: ImssuLeaderboardEntry[];
  selectedKey: string | null;
  onSelect: (entry: ImssuLeaderboardEntry) => void;
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
                <span className="mt-1 block max-w-[8.5rem] text-xs font-semibold uppercase leading-tight tracking-[0.1em] text-[var(--ink-muted)] sm:max-w-none">Átlagos találati percentilis</span>
              </span>
            </span>
            <span className="score-track mt-3 block" aria-hidden="true">
              <span style={{ width: `${Math.max(0, Math.min(entry.averagePercentile, 100))}%` }} />
            </span>
            <span className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-[var(--ink-muted)] sm:grid-cols-5">
              <span>Verseny <strong className="text-[var(--ink)]">{entry.matchCount}</strong></span>
              <span>Győzelem <strong className="text-[var(--ink)]">{entry.wins}</strong></span>
              <span>Dobogó <strong className="text-[var(--ink)]">{entry.podiums}</strong></span>
              <span>Legtöbb találat <strong className="text-[var(--ink)]">{entry.bestHits}</strong></span>
              <span>Győzteshez mérve <strong className="text-[var(--ink)]">{entry.averageWinnerShare === null ? "–" : `${formatNumber(entry.averageWinnerShare, 1)}%`}</strong></span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function CompetitorProfile({ entry }: { entry: ImssuLeaderboardEntry | null }) {
  return (
    <Card>
      <CardTitle className="font-display text-3xl">{entry?.competitorName ?? "Nincs kiválasztott versenyző"}</CardTitle>
      <CardDescription className="mt-1">
        {entry ? `${entry.division} · ${entry.club ?? "Nincs egyesületi adat"}` : "Válasszon versenyzőt a divíziórangsorból."}
      </CardDescription>
      {entry ? (
        <>
          <dl className="metric-grid mt-6">
            <div className="metric-value"><dt className="editorial-kicker">Átlagos találati percentilis</dt><dd>{formatNumber(entry.averagePercentile, 2)}%</dd></div>
            <div className="metric-value"><dt className="editorial-kicker">Értékelhető versenyek</dt><dd>{formatNumber(entry.matchCount)}</dd></div>
            <div className="metric-value"><dt className="editorial-kicker">Átlagos helyezés találatszám szerint</dt><dd>{formatNumber(entry.averagePosition, 2)}.</dd></div>
            <div className="metric-value"><dt className="editorial-kicker">Győzelmek / dobogók</dt><dd>{entry.wins} / {entry.podiums}</dd></div>
          </dl>
          <div className="mt-7 overflow-x-auto border-t border-[var(--rule)]">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <caption className="sr-only">A versenyző eredményei a kiválasztott divízióban</caption>
              <thead>
                <tr className="border-b border-[var(--rule)] text-xs uppercase tracking-[0.1em] text-[var(--ink-muted)]">
                  <th scope="col" className="py-3 pr-4 font-semibold">Verseny</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Hivatalos sorszám</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Találat / győztesé</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Mezőnyméret</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Percentilis</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Megjegyzés</th>
                  <th scope="col" className="py-3 font-semibold">Forrás</th>
                </tr>
              </thead>
              <tbody>
                {entry.results.map((result) => (
                  <tr key={`${result.competitionId}-${result.division}`} className="border-b border-[var(--rule)]">
                    <td className="py-3 pr-4">
                      <span className="block font-medium text-[var(--ink)]">{result.competitionName}</span>
                      <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">
                        <time dateTime={machineDate(result.competitionDate)}>{formatDate(result.competitionDate)}</time> · {result.competitionLevel}
                        {result.sourceDivision !== result.division ? ` · forrásban: ${result.sourceDivision}` : ""}
                      </span>
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{result.officialPlacement ? `${result.officialPlacement}.` : "Nincs adat"}</td>
                    <td className="py-3 pr-4 tabular-nums">{result.hits} / {result.winningHits}</td>
                    <td className="py-3 pr-4 tabular-nums">{result.fieldSize}</td>
                    <td className="py-3 pr-4 tabular-nums">{formatNumber(result.percentile, 1)}%</td>
                    <td className="max-w-40 break-words py-3 pr-4">{result.note ?? "–"}</td>
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

export function ImssuDashboard({ year, availableYears, competitionsFile, resultsFile, qualityFile, statistics }: ImssuDashboardProps) {
  const [competitionFilter, setCompetitionFilter] = useState("all");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [clubFilter, setClubFilter] = useState("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const divisionOptions = useMemo(() => ["all", ...statistics.divisions.map(({ value }) => value)], [statistics.divisions]);
  const clubOptions = useMemo(
    () => ["all", ...[...new Set(statistics.fieldResults.map(({ club }) => club).filter((club): club is string => Boolean(club)))].sort((a, b) => a.localeCompare(b, "hu"))],
    [statistics.fieldResults],
  );
  const filteredLeaderboard = useMemo(() => rankImssuResults(statistics.fieldResults.filter((result) =>
    (competitionFilter === "all" || result.competitionId === competitionFilter)
    && (divisionFilter === "all" || result.division === divisionFilter)
    && (clubFilter === "all" || result.club === clubFilter),
  )), [statistics.fieldResults, competitionFilter, divisionFilter, clubFilter]);
  const divisionsToShow = (divisionFilter === "all" ? statistics.divisions.map(({ value }) => value) : [divisionFilter])
    .filter((division) => filteredLeaderboard.some((entry) => entry.division === division));
  const selectedEntry = filteredLeaderboard.find((entry) => entry.key === selectedKey) ?? filteredLeaderboard[0] ?? null;

  const competitionChart = statistics.competitions
    .filter((competition) => competition.rankedRows > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((competition) => ({
      name: competition.name.length > 24 ? `${competition.name.slice(0, 22)}…` : competition.name,
      fullName: competition.name,
      results: competition.rankedRows,
    }));
  const exclusionGroups = [...statistics.excludedRows.reduce((groups, row) => {
    const key = `${row.reason}\u0000${row.competitionId}`;
    const group = groups.get(key) ?? { ...row, rows: 0 };
    group.rows += 1;
    groups.set(key, group);
    return groups;
  }, new Map<string, ImssuExcludedRow & { rows: number }>()).values()];

  return (
    <>
      <DashboardHeader
        disciplineSlug="imssu"
        disciplineName="IMSSU"
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
                IMSSU
                <span className="hero-title-year">{year}. évi szezon</span>
              </h1>
              <p className="hero-description">
                Fémsziluett-lövészet: divíziónként elkülönített szezonrangsorok, amelyek csak azonos versenyen és
                divízióban elért találatszámokat vetnek össze, hivatalos MDLSZ-eredményjegyzékekre visszavezetve.
              </p>
              <div className="hero-source-line">
                <span>Adatfrissítés: {competitionsFile.generatedAt ? formatDate(competitionsFile.generatedAt) : "a dátum nem ismert"}</span>
                <span>Összehasonlítható verseny-divízió mezők: {formatNumber(statistics.rankedFields)}</span>
                <a href={methodologyPath("imssu")} className="source-link">A rangsor módszertana</a>
              </div>
            </div>
            <dl className="hero-ledger" aria-label={`A ${year}. évi IMSSU-szezon összesítése`}>
              <SeasonFact label="Versenyek a naptárban" value={statistics.competitionCount} />
              <SeasonFact label="Versenyek értékelhető eredménnyel" value={statistics.competitionsWithResults} />
              <SeasonFact label="Rangsorolt versenyzők" value={statistics.rankedCompetitors} />
              <SeasonFact label="Rangsorba bevont eredmények" value={statistics.rankedRows} />
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
              description="A sorrendet a versenyenként és divíziónként számított találati percentilisek átlaga adja. Különböző versenyek nyers találatszámait nem vetjük össze, mert a célok száma versenyenként eltérhet."
              aside={<a href={methodologyPath("imssu")} className="source-link">A rangsor módszertana</a>}
            />
            {divisionsToShow.length ? (
              <div className="grid gap-x-10 gap-y-12 xl:grid-cols-2">
                {divisionsToShow.map((division) => (
                  <section key={division} className="min-w-0" aria-labelledby={`division-${encodeURIComponent(division)}`}>
                    <h3 id={`division-${encodeURIComponent(division)}`} className="mb-4 font-display text-3xl font-bold">{division}</h3>
                    <DivisionLeaderboard
                      entries={filteredLeaderboard.filter((entry) => entry.division === division)}
                      selectedKey={selectedEntry?.key ?? null}
                      onSelect={(entry) => {
                        setSelectedKey(entry.key);
                        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                        document.getElementById("details")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
                      }}
                    />
                  </section>
                ))}
              </div>
            ) : (
              <Card>
                <CardTitle>Nincs rangsorolható IMSSU-eredmény</CardTitle>
                <CardDescription className="mt-2 leading-6">
                  A kiválasztott szűrőkkel nincs olyan verseny-divízió mező, amelyben legalább két versenyző érvényes találatszáma szerepel. Módosítsa vagy törölje a szűrőket.
                </CardDescription>
              </Card>
            )}
          </section>

          <section id="analytics" data-dashboard-section className="dashboard-section" aria-labelledby="analytics-title">
            <SectionHeading
              id="analytics-title"
              title="Szezonstatisztikák"
              description="A teljes szezon rangsorba bevont eredményei, a felső szűrőktől függetlenül. A diagramok részvételt mutatnak, nem teljesítményt."
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <SectionChart title="Eredmények divíziónként" description="Rangsorba bevont eredmények száma divíziónként.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.divisions.slice(0, 12)} margin={{ top: 12, right: 12, bottom: 56, left: 0 }}>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="value" stroke={axisStroke} angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 9 }} />
                    <YAxis stroke={axisStroke} allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatNumber(Number(value))} contentStyle={tooltipStyle} />
                    <Bar dataKey="rows" name="Eredmény" fill={chartPalette[0]} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionChart>
              <SectionChart title="Értékelhető eredmények versenyenként" description="Időrendben, a rangsorba bevont versenyzői eredmények száma.">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={competitionChart} margin={{ top: 12, right: 16, bottom: 56, left: 0 }}>
                    <CartesianGrid stroke={gridStroke} vertical={false} />
                    <XAxis dataKey="name" stroke={axisStroke} angle={-32} textAnchor="end" interval="preserveStartEnd" tick={{ fontSize: 9 }} />
                    <YAxis stroke={axisStroke} allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ""} formatter={(value) => formatNumber(Number(value))} contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="results" name="Értékelhető eredmény" stroke={chartPalette[1]} strokeWidth={2.5} dot={{ r: 2.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </SectionChart>
              <SectionChart title="Eredmények versenyszint szerint" description="A versenynaptárban megadott szint; hiányzó szint esetén külön jelölve.">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statistics.levels} layout="vertical" margin={{ top: 8, right: 20, bottom: 8, left: 10 }}>
                    <CartesianGrid stroke={gridStroke} horizontal={false} />
                    <XAxis type="number" stroke={axisStroke} allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="value" stroke={axisStroke} width={150} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value) => formatNumber(Number(value))} contentStyle={tooltipStyle} />
                    <Bar dataKey="entries" name="Eredmény" radius={[0, 2, 2, 0]}>
                      {statistics.levels.map((entry, index) => <Cell key={entry.value} fill={chartPalette[(index + 2) % chartPalette.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </SectionChart>
              <SectionChart title="Divíziók mezőnye" description="Versenyzők, versenyek és átlagos mezőnyméret divíziónként; a korosztályi jelölések a Megjegyzés oszlopból.">
                <div className="grid h-full gap-5 sm:grid-cols-[1.4fr_0.6fr]">
                  <div className="min-w-0 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead><tr className="border-b border-[var(--rule)] text-xs text-[var(--ink-muted)]">
                        <th scope="col" className="py-2 pr-2 font-semibold">Divízió</th>
                        <th scope="col" className="py-2 pr-2 text-right font-semibold">Versenyző</th>
                        <th scope="col" className="py-2 pr-2 text-right font-semibold">Verseny</th>
                        <th scope="col" className="py-2 text-right font-semibold">Átl. mezőny</th>
                      </tr></thead>
                      <tbody>{statistics.divisions.map((division) => (
                        <tr key={division.value} className="border-b border-[var(--rule)]">
                          <th scope="row" className="py-2 pr-2 font-medium">{division.value}</th>
                          <td className="py-2 pr-2 text-right tabular-nums">{division.competitors}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{division.fields}</td>
                          <td className="py-2 text-right tabular-nums">{formatNumber(division.averageFieldSize, 1)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div className="min-w-0">
                    <h4 className="mb-3 text-sm font-semibold text-[var(--ink)]">Korosztályi jelölés</h4>
                    <dl className="space-y-3">
                      {statistics.ageNotes.map((item) => (
                        <div key={item.value} className="flex items-baseline justify-between gap-2 border-b border-[var(--rule)] pb-2 text-sm">
                          <dt className="truncate text-[var(--ink-muted)]">{item.value}</dt>
                          <dd className="shrink-0 tabular-nums">{formatNumber(item.entries)}</dd>
                        </div>
                      ))}
                      {!statistics.ageNotes.length ? <p className="text-sm text-[var(--ink-muted)]">Nincs adat.</p> : null}
                    </dl>
                  </div>
                </div>
              </SectionChart>
            </div>
          </section>

          <section id="details" data-dashboard-section className="dashboard-section" aria-labelledby="details-title">
            <SectionHeading
              id="details-title"
              title="Versenyzői adatlap és szezonelőzmények"
              description="Válasszon versenyzőt a rangsorból. A táblázat a hivatalos sorszámot, a saját és a győztes találatszámát, a mezőny méretét és a forrás eredményjegyzékét mutatja."
            />
            <CompetitorProfile entry={selectedEntry} />
          </section>

          <section id="competitions" data-dashboard-section className="dashboard-section" aria-labelledby="competitions-title">
            <SectionHeading
              id="competitions-title"
              title={`${year}. évi IMSSU-versenyek`}
              description="Versenyenként a feldolgozott sorok, a rangsorba bevont eredmények, a divíziók és a hivatalos források."
              aside={<a className="source-link" href={competitionsFile.sourceUrl} target="_blank" rel="noreferrer">MDLSZ-versenynaptár <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></a>}
            />
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
                      <div><dt>Rangsorba bevont eredmények</dt><dd>{formatNumber(competition.rankedRows)}</dd></div>
                      <div><dt>Divíziók</dt><dd>{competition.divisions.join(", ") || "Nincs összehasonlítható adat"}</dd></div>
                    </dl>
                    {competition.downloadStatus && competition.downloadStatus !== "downloaded" ? (
                      <p className="mt-3 break-words text-sm font-medium text-[var(--signal)]">
                        {competition.downloadStatus === "failed" ? "Az eredmény-PDF letöltése sikertelen." : "A versenyhez még nem érhető el feldolgozható eredmény-PDF."}
                        {competition.downloadError ? ` ${competition.downloadError}` : ""}
                      </p>
                    ) : competition.resultRows > 0 && competition.rankedRows === 0 ? (
                      <p className="mt-3 text-sm font-medium text-[var(--signal)]">A forrásdokumentum sorai nem tartalmaznak értékelhető divízió- és találatadatot; részletek az adatminőségi részben.</p>
                    ) : competition.resultRows === 0 ? (
                      <p className="mt-3 text-sm text-[var(--ink-muted)]">A dokumentumból nem nyerhető ki eredménysor.</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      <a href={competition.sourceUrl} target="_blank" rel="noreferrer" className="source-link">Hivatalos versenyadatok <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></a>
                      {competition.resultPdfUrl ? (
                        <a href={competition.resultPdfUrl} target="_blank" rel="noreferrer" className="source-link">Eredmény-PDF <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></a>
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
              description="Az országos bajnoki eredmények és a csúcsjelölések az eredményjegyzékekből származnak; a további kiemelések leíró összesítések."
            />
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardTitle className="font-display text-3xl">Országos bajnokság – divíziógyőztesek</CardTitle>
                <CardDescription className="mt-1">A hivatalos eredményjegyzék 1. sorszáma divíziónként, az „Országos Bajnokság” szintű versenyeken.</CardDescription>
                {statistics.championshipWinners.length ? (
                  <ul className="mt-5 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
                    {statistics.championshipWinners.map((winner) => (
                      <li key={`${winner.competitionId}-${winner.division}`} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
                        <span className="min-w-0 text-[var(--ink-muted)]">{winner.division}</span>
                        <span className="text-right"><strong className="text-[var(--ink)]">{winner.competitorName}</strong> <span className="tabular-nums text-[var(--ink-muted)]">· {winner.hits} találat</span></span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-5 text-sm text-[var(--ink-muted)]">Ebben a szezonban még nincs feldolgozott országos bajnoki eredmény.</p>}
              </Card>
              <Card className="editorial-panel">
                <dl className="insights-list">
                  <div className="insight-entry"><dt>Legnagyobb mezőny</dt><dd>{statistics.largestField ? `${statistics.largestField.division} · ${statistics.largestField.size} fő` : "Nincs adat"}</dd></div>
                  <div className="insight-entry"><dt>Legtöbb versenyen induló versenyző</dt><dd>{statistics.mostActive ? `${statistics.mostActive.name} · ${statistics.mostActive.competitions} verseny` : "Nincs adat"}</dd></div>
                  <div className="insight-entry"><dt>Legtöbb divízióban induló versenyző</dt><dd>{statistics.mostVersatile ? `${statistics.mostVersatile.name} · ${statistics.mostVersatile.divisions} divízió` : "Nincs adat"}</dd></div>
                </dl>
                <h3 className="mt-7 font-display text-2xl font-bold">Országos csúcs a megjegyzésekben</h3>
                {statistics.recordNotes.length ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    {statistics.recordNotes.map((record) => (
                      <li key={`${record.competitionId}-${record.division}-${record.competitorKey}`}>
                        <strong>{record.competitorName}</strong> · {record.division} · {record.hits} találat
                        <span className="block text-xs text-[var(--ink-muted)]">„{record.note}” · {record.competitionName}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-3 text-sm text-[var(--ink-muted)]">Az eredményjegyzékek nem jelölnek országos csúcsot.</p>}
              </Card>
            </div>
          </section>

          <section id="data-quality" data-dashboard-section className="dashboard-section" aria-labelledby="quality-title">
            <SectionHeading
              id="quality-title"
              title="Adatminőség és visszakövethetőség"
              description="A hiányos vagy félreérthető forrássorok nyíltan megjelennek; találgatással nem kerülnek rangsorba."
            />
            {!!(competitionsFile.errors.length || qualityFile.errors.length) && (
              <Card className="quality-warning mb-6">
                <CardTitle>Feldolgozási figyelmeztetések</CardTitle>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {[...competitionsFile.errors, ...qualityFile.errors].slice(0, 30).map((error) => <li key={error} className="break-words">{error}</li>)}
                </ul>
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
                    <div className="metric-value" key={label as string}><dt className="editorial-kicker">{label as string}</dt><dd>{formatNumber(value as number)}</dd></div>
                  ))}
                </dl>
              </Card>
              <Card>
                <CardTitle className="font-display text-3xl">Rangsorolási kizárások</CardTitle>
                <CardDescription className="mt-1">Ezek a sorok a forrásadatokban megmaradnak, de a rangsorhoz nem elégségesek.</CardDescription>
                <dl className="quality-grid mt-5">
                  <div className="metric-value"><dt className="editorial-kicker">Kizárt forrássorok</dt><dd>{formatNumber(statistics.excludedRows.length)}</dd></div>
                  <div className="metric-value"><dt className="editorial-kicker">Összevont ismétlődő sorok</dt><dd>{formatNumber(statistics.duplicateIdentityRows)}</dd></div>
                  <div className="metric-value"><dt className="editorial-kicker">Egyfős verseny-divízió mezők</dt><dd>{formatNumber(statistics.singletonFields)}</dd></div>
                  <div className="metric-value"><dt className="editorial-kicker">Rangsoron kívüli egyfős eredmények</dt><dd>{formatNumber(statistics.singletonRows)}</dd></div>
                </dl>
                {exclusionGroups.length ? (
                  <ul className="mt-6 space-y-3 border-t border-[var(--rule)] pt-4 text-sm">
                    {exclusionGroups.map((group) => (
                      <li key={`${group.reason}-${group.competitionId}`}>
                        <strong>{group.competitionName}</strong> <span className="text-[var(--ink-muted)]">({group.competitionId})</span>
                        <span className="block text-[var(--ink-muted)]">{exclusionLabels[group.reason]} · {formatNumber(group.rows)} sor</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            </div>
          </section>
        </main>
        <SiteFooter disciplineSlug="imssu" year={year} />
      </div>
    </>
  );
}
