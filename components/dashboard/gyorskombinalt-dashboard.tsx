"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { SectionChart } from "@/components/charts/section-chart";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card } from "@/components/ui/card";
import { methodologyPath } from "@/lib/discipline-paths";
import { buildGyorskombinaltStatistics, gyorskombinaltIdentity } from "@/lib/gyorskombinalt-statistics";
import type { CompetitionDiscoveryFile, CompetitionResult, QualityFile, ResultsFile } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/utils";

interface Props {
  year: number;
  availableYears: number[];
  competitionsFile: CompetitionDiscoveryFile;
  resultsFile: ResultsFile;
  qualityFile: QualityFile;
}

function SourceTable({ results, sources }: { results: CompetitionResult[]; sources: Map<string, string> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] text-left text-sm">
        <caption className="sr-only">Eredeti eredményértékek, forrássorszámok és hivatalos eredményjegyzékek</caption>
        <thead><tr className="border-b-2 border-[var(--ink)]">
          {["Versenyző / verseny", "Divízió", "Forrássorszám", "Eredmény", "Közölt %", "Megjegyzés", "Forrás"].map((label) => (
            <th key={label} scope="col" className="px-3 py-3 font-semibold">{label}</th>
          ))}
        </tr></thead>
        <tbody>{results.map((result, index) => (
          <tr key={`${result.competitionId}-${index}`} className="border-b border-[var(--rule)]">
            <td className="max-w-72 px-3 py-4"><strong className="block">{result.competitorName}</strong>
              <span className="block text-[var(--ink-muted)]">{result.competitionName}</span>
              <span className="block text-xs text-[var(--ink-muted)]">{formatDate(result.competitionDate)} · {result.club || result.team || "Nincs egyesületi adat"}</span>
            </td>
            <td className="px-3 py-4">{result.division || "Nincs adat"}</td>
            <td className="px-3 py-4 tabular-nums">{result.rawPlacement || "Nincs adat"}</td>
            <td className="px-3 py-4 tabular-nums">{result.rawResult || "Nincs adat"}</td>
            <td className="px-3 py-4 tabular-nums">{result.resultPercentage || "Nincs adat"}</td>
            <td className="max-w-48 break-words px-3 py-4">{result.rawNotes || "Nincs adat"}</td>
            <td className="px-3 py-4"><a className="source-link" href={sources.get(result.competitionId)} target="_blank" rel="noreferrer" aria-label={`${result.competitionName} hivatalos eredményjegyzéke`}>Eredményjegyzék</a></td>
          </tr>
        ))}</tbody>
      </table>
      {!results.length && <p role="status" className="py-8 text-[var(--ink-muted)]">A kiválasztott feltételekkel nincs eredménysor. Módosítsa a szűrőket vagy a keresést.</p>}
    </div>
  );
}

export function GyorskombinaltDashboard({ year, availableYears, competitionsFile, resultsFile, qualityFile }: Props) {
  const [competition, setCompetition] = useState("all");
  const [division, setDivision] = useState("all");
  const [club, setClub] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("");
  const [page, setPage] = useState(0);
  const season = useMemo(() => buildGyorskombinaltStatistics(competitionsFile.competitions, resultsFile.results), [competitionsFile, resultsFile]);
  const filteredRows = useMemo(() => season.linkedResults.filter((result) =>
    (competition === "all" || result.competitionId === competition) &&
    (division === "all" || (result.division || "Nincs divízióadat") === division) &&
    (club === "all" || (result.club || result.team) === club),
  ), [season, competition, division, club]);
  const filtered = useMemo(() => buildGyorskombinaltStatistics(
    season.competitions.filter((entry) => competition === "all" || entry.id === competition), filteredRows,
  ), [season, competition, filteredRows]);
  const searchedRows = filteredRows.filter((result) => result.competitorName.toLocaleLowerCase("hu").includes(query.trim().toLocaleLowerCase("hu")));
  const pageCount = Math.max(1, Math.ceil(searchedRows.length / 25));
  const currentPage = Math.min(page, pageCount - 1);
  const person = filtered.people.find(({ key }) => key === selectedPerson) ?? filtered.people[0];
  const personRows = person ? filteredRows.filter((result) => gyorskombinaltIdentity(result) === person.key) : [];
  const sources = new Map(season.competitions.map((entry) => [entry.id, entry.resultPdfUrl || entry.sourceUrl]));
  const topPerson = season.people[0];
  const diagnostics = [...competitionsFile.errors, ...qualityFile.errors];
  const controlClass = "rounded-sm border border-[var(--rule)] bg-[var(--paper)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--signal)]";

  return (
    <>
      <DashboardHeader disciplineSlug="gyorskombinalt" disciplineName="Gyorskombinált" year={year} availableYears={availableYears}
        competitionOptions={season.competitions} divisionOptions={["all", ...season.divisions.map(({ name }) => name)]}
        clubOptions={["all", ...season.clubs.map(({ name }) => name)]}
        competition={competition} division={division} club={club}
        onCompetitionChange={(value) => { setCompetition(value); setPage(0); }}
        onDivisionChange={(value) => { setDivision(value); setPage(0); }}
        onClubChange={(value) => { setClub(value); setPage(0); }}
        sectionLabels={{ rankings: "Részvétel", details: "Eredmények" }}
      />
      <div className="dashboard-main">
        <section id="overview" data-dashboard-section className="season-hero" aria-labelledby="overview-title">
          <div className="season-hero-inner">
            <div>
              <h1 id="overview-title" className="hero-title break-words" style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)" }}>Gyorskombinált<span className="hero-title-year">{year}. évi szezon</span></h1>
              <p className="hero-description">Versenyzői részvétel, divíziók és hivatalos eredményjegyzékek a Gyorskombinált és Precíziós szakágban. Forrásalapú kimutatás, számított szezonrangsor nélkül.</p>
              <div className="hero-source-line"><span>Adatfrissítés: {formatDate(competitionsFile.generatedAt)}</span><a href={methodologyPath("gyorskombinalt")} className="source-link">A kimutatás módszertana</a></div>
            </div>
            <dl className="hero-ledger">
              {[
                ["Versenyek a naptárban", season.competitions.length],
                ["Versenyek eredménysorral", season.competitions.filter(({ rows }) => rows > 0).length],
                ["Versenyzői azonosítók", season.people.length],
                ["Forrásból feldolgozott sorok", resultsFile.results.length],
                ["Divíziómegnevezések", season.divisions.length],
                ["Képviselt egyesületek", season.clubs.length],
              ].map(([label, value]) => <div key={label} className="hero-ledger-item"><dt className="hero-ledger-label">{label}</dt><dd className="hero-ledger-value">{formatNumber(Number(value))}</dd></div>)}
            </dl>
          </div>
        </section>
        <main id="content" tabIndex={-1} className="dashboard-content">
          <section id="rankings" data-dashboard-section className="dashboard-section" aria-labelledby="participation-title">
            <SectionHeading id="participation-title" title="Részvétel divíziónként" description="A szűrők az alábbi részvételi kimutatást és az eredményeket módosítják. Az eredménysor nem feltétlenül önálló versenyindulás; a divíziónevek a forrásból változatlanul jelennek meg." />
            <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm">
              <thead><tr className="border-b-2 border-[var(--ink)]">{["Divízió", "Eredménysor", "Versenyzői azonosító", "Verseny"].map((label) => <th key={label} scope="col" className="py-3 pr-4">{label}</th>)}</tr></thead>
              <tbody>{filtered.divisions.map((entry) => <tr key={entry.name} className="border-b border-[var(--rule)]"><th scope="row" className="py-4 pr-4 font-semibold">{entry.name}</th><td>{formatNumber(entry.rows)}</td><td>{formatNumber(entry.people)}</td><td>{formatNumber(entry.matches)}</td></tr>)}</tbody>
            </table></div>
            {!filtered.divisions.length && <p role="status" className="py-6">A kiválasztott szűrőkkel nincs részvételi adat.</p>}
          </section>
          <section id="analytics" data-dashboard-section className="dashboard-section" aria-labelledby="analytics-title">
            <SectionHeading id="analytics-title" title="A szezon aktivitása" description="Teljes szezonadatok, a felső szűrőktől függetlenül. A diagramok részvételt mutatnak, nem sporteredményességet." />
            <div className="grid gap-6 lg:grid-cols-2">
              <SectionChart title="Versenyek havonta" description="A naptári eseményeket a kezdő dátum hónapja szerint összesítjük.">
                <ResponsiveContainer width="100%" height="100%"><BarChart data={season.months}>
                  <CartesianGrid vertical={false} stroke="#dedacf" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} />
                  <Tooltip /><Bar dataKey="count" name="Versenyek" fill="#a82e2c" />
                </BarChart></ResponsiveContainer>
              </SectionChart>
              <SectionChart title="Egyesületi részvétel" description="A tíz legtöbb forrássorral képviselt egyesület; nem egyesületi teljesítményrangsor.">
                <ResponsiveContainer width="100%" height="100%"><BarChart data={season.clubs.slice(0, 10)} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid horizontal={false} stroke="#dedacf" /><XAxis type="number" allowDecimals={false} /><YAxis type="category" dataKey="name" width={145} tick={{ fontSize: 10 }} />
                  <Tooltip /><Bar dataKey="rows" name="Eredménysorok" fill="#176a63" />
                </BarChart></ResponsiveContainer>
              </SectionChart>
            </div>
          </section>
          <section id="details" data-dashboard-section className="dashboard-section" aria-labelledby="details-title">
            <SectionHeading id="details-title" title="Eredmények és versenyzői előzmények" description="A közölt értékeket eredeti formájukban mutatjuk. A forrássorszám nem igazolt helyezés; a megjegyzés értékét nem minősítjük automatikusan időeredménynek." />
            <Card>
              <label htmlFor="gyorskombinalt-person" className="block text-sm font-semibold">Versenyzői előzmények</label>
              <select id="gyorskombinalt-person" className={`${controlClass} mt-2 w-full max-w-xl`} value={person?.key ?? ""} onChange={(event) => setSelectedPerson(event.target.value)}>
                {!filtered.people.length && <option value="">Nincs versenyző a szűrt adatokban</option>}
                {filtered.people.map((entry) => <option key={entry.key} value={entry.key}>{entry.name} · {entry.matches} verseny · {entry.key.startsWith("license:") ? `engedély: ${entry.key.slice(8)}` : "névalapú azonosítás"}</option>)}
              </select>
              {person && <p className="my-4 text-sm text-[var(--ink-muted)]">{person.matches} különböző verseny · {person.rows} eredménysor · {person.divisions.join(", ")}</p>}
              <SourceTable results={personRows} sources={sources} />
            </Card>
            <div className="mt-8">
              <label htmlFor="gyorskombinalt-search" className="block text-sm font-semibold">Keresés az összes szűrt eredmény között</label>
              <input id="gyorskombinalt-search" type="search" className={`${controlClass} my-3 w-full max-w-xl`} value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Versenyző neve" />
              <p role="status" className="mb-4 text-sm text-[var(--ink-muted)]">{formatNumber(searchedRows.length)} eredménysor · oldalanként 25 sor</p>
              <SourceTable results={searchedRows.slice(currentPage * 25, (currentPage + 1) * 25)} sources={sources} />
              <nav aria-label="Eredménytábla lapozása" className="mt-4 flex items-center gap-4">
                <button className={`${controlClass} disabled:opacity-50`} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Előző oldal</button>
                <span className="text-sm">{currentPage + 1} / {pageCount}</span>
                <button className={`${controlClass} disabled:opacity-50`} disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)}>Következő oldal</button>
              </nav>
            </div>
          </section>
          <section id="competitions" data-dashboard-section className="dashboard-section" aria-labelledby="competitions-title">
            <SectionHeading id="competitions-title" title="Versenynaptár és eredményforrások" description="A kiválasztott verseny, divízió és egyesület szerinti forrássorok száma; minden naptári esemény ellenőrizhető." />
            <ol className="competition-list">{filtered.competitions.map((entry) => <li key={entry.id} className="competition-entry">
              <div className="competition-date">{formatDate(entry.date)}</div>
              <div className="min-w-0 flex-1"><h3 className="competition-name">{entry.name}</h3><p className="mt-2 text-sm text-[var(--ink-muted)]">{entry.location || "Nincs helyszínadat"} · {entry.level || "Nincs versenyszintadat"}</p>
                <p className="my-3 text-sm">{entry.rows} szűrt eredménysor · {entry.people} versenyzői azonosító</p>
                {!entry.rows && <p className="mb-3 text-sm text-[var(--ink-muted)]">Nincs feldolgozott eredménysor a jelenlegi szűrésben.</p>}
                {entry.downloadError && <p className="mb-3 break-words text-sm text-[var(--signal)]">{entry.downloadError}</p>}
                <a href={entry.resultPdfUrl || entry.sourceUrl} className="source-link" target="_blank" rel="noreferrer">Hivatalos forrás</a>
              </div>
            </li>)}</ol>
          </section>
          <section id="insights" data-dashboard-section className="dashboard-section" aria-labelledby="insights-title">
            <SectionHeading id="insights-title" title="Szezonkiemelések" description="A teljes feldolgozott szezon részvételi adatai alapján, sportteljesítményre vonatkozó következtetés nélkül." />
            <dl className="quality-grid">
              <div><dt className="text-sm text-[var(--ink-muted)]">A legtöbb különböző versenyen megjelenő azonosító</dt><dd className="mt-2 font-display text-2xl font-bold">{topPerson?.name || "Nincs adat"}</dd><dd className="mt-1 text-sm">{topPerson ? `${topPerson.matches} verseny; azonos szám esetén az eredménysorok száma, majd a név szerinti sorrend dönt` : "Nincs feldolgozott részvétel"}</dd></div>
              <div><dt className="text-sm text-[var(--ink-muted)]">A legtöbb forrássorral képviselt divízió</dt><dd className="mt-2 font-display text-2xl font-bold">{season.divisions[0]?.name || "Nincs adat"}</dd><dd className="mt-1 text-sm">{formatNumber(season.divisions[0]?.rows ?? 0)} eredménysor</dd></div>
            </dl>
          </section>
          <section id="data-quality" data-dashboard-section className="dashboard-section" aria-labelledby="quality-title">
            <SectionHeading id="quality-title" title="Adatminőség és értelmezési korlátok" description="A kvalifikációs, minősítő és precíziós események a szakági naptár részei. Pontjaikat és megjegyzésértékeiket nem vonjuk közös teljesítményskálára." />
            <dl className="quality-grid">
              {[
                ["Feldolgozott PDF-ek", qualityFile.quality.successfullyProcessedPdfs],
                ["Sikertelen PDF-feldolgozások", qualityFile.quality.failedPdfs],
                ["Feldolgozási diagnosztikák", resultsFile.parsingErrors.length],
                ["Bizonytalan névazonosítások", resultsFile.ambiguousCompetitors.length],
                ["Naptári versenyhez nem kapcsolható sorok", season.unlinkedRows],
                ["Havi kimutatásból kimaradó dátumok", season.undatedCompetitions],
              ].map(([label, value]) => <div key={label} className="metric-value"><dt className="editorial-kicker">{label}</dt><dd>{formatNumber(Number(value))}</dd></div>)}
            </dl>
            <p className="mt-6 max-w-[70ch] text-sm leading-6 text-[var(--ink-muted)]">Az azonosítás numerikus versenyengedély alapján történik, ha a forrás közli; egyébként normalizált név szerint. A névalapú és engedélyalapú rekordokat nem kapcsoljuk össze automatikusan. A különböző divízióneveket nem egyesítjük. Egy sor nem feltétlenül egy önálló indulás, és a „Sorszám” oszlopból nem következtetünk helyezésre.</p>
            {diagnostics.length > 0 && <ul className="mt-5 space-y-2 text-sm">{diagnostics.map((error, index) => <li key={index} className="break-words">{error}</li>)}</ul>}
            {resultsFile.parsingErrors.length > 0 && <details className="mt-5"><summary>Feldolgozási diagnosztikák megtekintése</summary><pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(resultsFile.parsingErrors, null, 2)}</pre></details>}
            {resultsFile.ambiguousCompetitors.length > 0 && <details className="mt-5"><summary>Bizonytalan azonosítások megtekintése</summary><pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(resultsFile.ambiguousCompetitors, null, 2)}</pre></details>}
          </section>
        </main>
      </div>
      <SiteFooter disciplineSlug="gyorskombinalt" year={year} />
    </>
  );
}
