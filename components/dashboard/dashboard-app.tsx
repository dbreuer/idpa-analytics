"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  Award,
  Gauge,
  Shield,
  Timer,
  Trophy,
} from "lucide-react";
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

import { SectionChart } from "@/components/charts/section-chart";
import { CompetitionTimeline } from "@/components/competition/competition-timeline";
import { TopCompetitors } from "@/components/leaderboard/top-competitors";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import type {
  CompetitionDiscoveryFile,
  QualityFile,
  ResultsFile,
  StatisticsSnapshot,
  CompetitorStanding,
  ClubStanding,
} from "@/lib/types";
import { formatDate, formatNullableNumber, formatNumber } from "@/lib/utils";

interface DashboardAppProps {
  competitionsFile: CompetitionDiscoveryFile;
  resultsFile: ResultsFile;
  qualityFile: QualityFile;
  statistics: StatisticsSnapshot;
}

const medalColors = ["#facc15", "#cbd5e1", "#fb923c", "#a855f7", "#22d3ee"];

export function DashboardApp({
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

  const filteredTop5 = filteredCompetitors.slice().sort((a, b) => b.overallScore - a.overallScore).slice(0, 5);
  const filteredClubs = statistics.clubsRanking.filter((club) => clubFilter === "all" || club.club === clubFilter).slice(0, 5);
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

  const displayedCompetitor = selectedCompetitor && filteredCompetitors.some((entry) => entry.normalizedCompetitorName === selectedCompetitor.normalizedCompetitorName)
    ? selectedCompetitor
    : filteredTop5[0] ?? null;
  const displayedClub = selectedClub && statistics.clubsRanking.some((entry) => entry.club === selectedClub.club)
    ? selectedClub
    : filteredClubs[0] ?? null;

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,#312e81,transparent_40%),radial-gradient(circle_at_right,#0ea5e9,transparent_35%),linear-gradient(180deg,#020617_0%,#020617_100%)] px-6 py-12 shadow-2xl md:px-10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04),transparent_35%,transparent_65%,rgba(255,255,255,0.03))]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <Badge>🇭🇺 MDLSZ · Official source PDFs</Badge>
            <h1 className="mt-5 max-w-3xl text-5xl font-black tracking-tight text-white md:text-7xl">
              IDPA 2025 <span className="bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-orange-300 bg-clip-text text-transparent">Season Analytics</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-300">
              Premium season intelligence for Hungarian IDPA competitions with transparent methodology, resilient PDF parsing, and filter-driven insight views.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
              <span>Generated: {competitionsFile.generatedAt ? formatDate(competitionsFile.generatedAt) : "Not yet generated"}</span>
              <span>•</span>
              <span>PDFs processed: {qualityFile.quality.successfullyProcessedPdfs}/{qualityFile.quality.totalPdfsDiscovered}</span>
              <span>•</span>
              <span>Parse errors visible: {qualityFile.quality.rowsWithParsingErrors}</span>
            </div>
          </div>
          <Card className="grid grid-cols-2 gap-4 bg-black/20">
            {[
              { label: "Total Competitions", value: statistics.totalCompetitions, icon: Trophy },
              { label: "Unique Competitors", value: statistics.uniqueCompetitors, icon: Shield },
              { label: "Clubs", value: statistics.clubs, icon: Award },
              { label: "Total Entries", value: statistics.totalEntries, icon: Activity },
              { label: "Fastest Recorded Time", value: formatNullableNumber(statistics.fastestRecordedTime, 2), icon: Timer },
              { label: "Most Active Competitor", value: statistics.mostActiveCompetitor ?? "N/A", icon: Gauge },
            ].map((item, index) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <item.icon className="mb-3 h-5 w-5 text-cyan-200" />
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{typeof item.value === "number" ? formatNumber(item.value) : item.value}</p>
              </motion.div>
            ))}
          </Card>
        </div>
      </section>

      <section className="mt-10 grid gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 md:grid-cols-4">
        <label className="text-sm text-slate-200">
          <span className="mb-2 block uppercase tracking-[0.2em] text-slate-400">Competition</span>
          <select value={competitionFilter} onChange={(event) => setCompetitionFilter(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
            <option value="all">All Competitions</option>
            {statistics.competitions.map((competition) => (
              <option key={competition.competitionId} value={competition.competitionId}>{competition.competitionName}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-200">
          <span className="mb-2 block uppercase tracking-[0.2em] text-slate-400">Division</span>
          <select value={divisionFilter} onChange={(event) => setDivisionFilter(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
            {divisionOptions.map((division) => (
              <option key={division} value={division}>{division === "all" ? "All Divisions" : division}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-200">
          <span className="mb-2 block uppercase tracking-[0.2em] text-slate-400">Club</span>
          <select value={clubFilter} onChange={(event) => setClubFilter(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none">
            {clubOptions.map((club) => (
              <option key={club} value={club}>{club === "all" ? "All Clubs" : club}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-200">
          <span className="mb-2 block uppercase tracking-[0.2em] text-slate-400">Minimum Participation</span>
          <div className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
            <input type="range" min={1} max={5} value={minimumParticipation} onChange={(event) => setMinimumParticipation(Number(event.target.value))} className="w-full accent-cyan-300" />
            <div className="mt-2 text-white">{minimumParticipation}{minimumParticipation === 5 ? "+" : ""}</div>
          </div>
        </label>
      </section>

      {!!competitionsFile.errors.length && (
        <Card className="mt-8 border-orange-400/20 bg-orange-500/5">
          <CardTitle>Source access warnings</CardTitle>
          <CardDescription className="mt-2">The pipeline keeps failures visible instead of hiding missing data.</CardDescription>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-orange-100">
            {competitionsFile.errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </Card>
      )}

      <section className="mt-8 grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <TopCompetitors competitors={filteredTop5} onSelect={setSelectedCompetitor} />
        <Card>
          <Badge>🏅 Club Power Ranking</Badge>
          <CardTitle className="mt-3 text-2xl">Top Clubs</CardTitle>
          <CardDescription>Club Power uses capped member contribution; Club Strength tracks average member output.</CardDescription>
          <div className="mt-6 space-y-4">
            {filteredClubs.map((club, index) => (
              <button key={club.club} type="button" onClick={() => setSelectedClub(club)} className="w-full text-left">
                <div className="rounded-3xl border border-white/8 bg-slate-950/70 p-4 transition hover:border-cyan-300/30">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">#{index + 1}</p>
                      <p className="text-lg font-semibold text-white">{club.club}</p>
                    </div>
                    <div className="text-right text-sm text-slate-300">
                      <p>Power: {formatNumber(club.powerScore, 0)}</p>
                      <p>Strength: {formatNumber(club.strengthScore, 0)}</p>
                    </div>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400" style={{ width: `${Math.max(18, (club.powerScore / (filteredClubs[0]?.powerScore || 1)) * 100)}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <SectionChart title="Competitor Performance Matrix" description="Participation vs performance score, with podium count encoded in bubble size.">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" />
              <XAxis type="number" dataKey="x" stroke="#cbd5e1" name="Participation" />
              <YAxis type="number" dataKey="y" stroke="#cbd5e1" name="Performance Score" />
              <Tooltip cursor={{ strokeDasharray: "4 4" }} contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Scatter data={eliteMatrix} fill="#22d3ee" />
            </ScatterChart>
          </ResponsiveContainer>
        </SectionChart>
        <SectionChart title="Speed vs Consistency" description="Normalized speed score against consistency score, highlighting the elite zone.">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" />
              <XAxis type="number" dataKey="x" stroke="#cbd5e1" name="Consistency" />
              <YAxis type="number" dataKey="y" stroke="#cbd5e1" name="Speed" />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Scatter data={speedVsConsistency} fill="#f97316" />
            </ScatterChart>
          </ResponsiveContainer>
        </SectionChart>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <SectionChart title="Division Distribution" description="Competitor activity discovered dynamically from the source results.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statistics.divisions.slice(0, 8)}>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="division" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Bar dataKey="appearances" radius={[10, 10, 0, 0]}>
                {statistics.divisions.slice(0, 8).map((division, index) => (
                  <Cell key={division.division} fill={medalColors[index % medalColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionChart>
        <SectionChart title="Club Strength Comparison" description="Club Power versus Club Strength to avoid rewarding participation volume alone.">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statistics.clubsRanking.slice(0, 6)} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" horizontal={false} />
              <XAxis type="number" stroke="#cbd5e1" />
              <YAxis type="category" dataKey="club" stroke="#cbd5e1" width={110} />
              <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Legend />
              <Bar dataKey="powerScore" name="Club Power" fill="#a855f7" radius={[0, 10, 10, 0]} />
              <Bar dataKey="strengthScore" name="Club Strength" fill="#22d3ee" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionChart>
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_1fr]">
        <Card>
          <Badge>Competitor Detail</Badge>
          <CardTitle className="mt-3 text-2xl">{displayedCompetitor?.competitorName ?? "No competitor selected"}</CardTitle>
          <CardDescription>{displayedCompetitor?.club ?? "Club N/A"}</CardDescription>
          {displayedCompetitor ? (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Overall Score", formatNumber(displayedCompetitor.overallScore, 0)],
                  ["Wins", displayedCompetitor.wins],
                  ["Podiums", displayedCompetitor.podiums],
                  ["Competitions", displayedCompetitor.uniqueCompetitions],
                  ["Average Placement", formatNullableNumber(displayedCompetitor.averagePlacement, 2)],
                  ["Fastest Time", formatNullableNumber(displayedCompetitor.fastestTime, 2)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                    <p className="mt-2 text-xl font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayedCompetitor.placementsByDate}>
                    <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                    <XAxis dataKey="date" stroke="#cbd5e1" tickFormatter={formatDate} />
                    <YAxis reversed stroke="#cbd5e1" allowDecimals={false} domain={[1, "dataMax"]} />
                    <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <Line type="monotone" dataKey="placement" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <p className="mt-6 text-slate-400">Run the pipeline to populate competitor detail data.</p>
          )}
        </Card>

        <Card>
          <Badge>Club Detail</Badge>
          <CardTitle className="mt-3 text-2xl">{displayedClub?.club ?? "No club selected"}</CardTitle>
          <CardDescription>{displayedClub ? `${displayedClub.members} members · ${displayedClub.appearances} appearances` : "Club metrics appear after data normalization."}</CardDescription>
          {displayedClub ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ["Club Power", formatNumber(displayedClub.powerScore, 0)],
                ["Club Strength", formatNumber(displayedClub.strengthScore, 0)],
                ["Wins", displayedClub.wins],
                ["Podiums", displayedClub.podiums],
                ["Average Placement", formatNullableNumber(displayedClub.averagePlacement, 2)],
                ["Top Competitor", displayedClub.topCompetitor ?? "N/A"],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <p className="mt-2 text-base font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-slate-400">Run the pipeline to populate club detail data.</p>
          )}
        </Card>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <CompetitionTimeline competitions={statistics.competitions} />
        <Card>
          <Badge>Season Awards</Badge>
          <CardTitle className="mt-3 text-2xl">Interesting Season Insights</CardTitle>
          <CardDescription>Automatically derived from normalized official source data.</CardDescription>
          <div className="mt-6 space-y-3">
            {[
              ["👑 The Dominator", statistics.insights.dominator],
              ["⚡ The Speed Demon", statistics.insights.speedDemon],
              ["🔥 The Ironman", statistics.insights.ironman],
              ["🎯 Mr. Consistent", statistics.insights.mrConsistent],
              ["🚀 Rising Star", statistics.insights.risingStar],
              ["🏟️ Biggest Competition", statistics.insights.biggestCompetition],
              ["👥 Strongest Club", statistics.insights.strongestClub],
              ["🥇 Podium Machine", statistics.insights.podiumMachine],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-1 text-lg font-semibold text-white">{value ?? "N/A"}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/methodology" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-300/40 hover:bg-cyan-400/10">
              View Methodology
            </Link>
            <a href={competitionsFile.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-white transition hover:border-cyan-300/40 hover:bg-cyan-400/20">
              Open MDLSZ Calendar
            </a>
          </div>
        </Card>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <Badge>Data Quality Dashboard</Badge>
          <CardTitle className="mt-3 text-2xl">Pipeline Health</CardTitle>
          <CardDescription>The dashboard never hides failed downloads, parse issues, or missing team data.</CardDescription>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {Object.entries(qualityFile.quality).map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label.replace(/([A-Z])/g, " $1")}</p>
                <p className="mt-2 text-xl font-semibold text-white">{formatNumber(value)}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <Badge>Normalization Visibility</Badge>
          <CardTitle className="mt-3 text-2xl">Traceability</CardTitle>
          <CardDescription>Every major statistic is traceable back to official MDLSZ source rows and PDFs.</CardDescription>
          <div className="mt-6 space-y-4 text-sm text-slate-300">
            <p>Competitions discovered: {competitionsFile.discoveredCount}</p>
            <p>Normalized competitor rows: {resultsFile.results.length}</p>
            <p>Rows with parsing issues: {resultsFile.parsingErrors.length}</p>
            <p>Ambiguous competitor identities: {resultsFile.ambiguousCompetitors.length}</p>
            <p>Methodology labels raw times as non-comparable unless normalized within each competition.</p>
          </div>
        </Card>
      </section>
    </div>
  );
}
