import { sourceCompetitorKey } from "@/lib/competitor-identity";
import type { Competition, CompetitionResult } from "@/lib/types";

export interface ImssuCount {
  value: string;
  entries: number;
}

export interface ImssuFieldResult {
  competitionId: string;
  competitionName: string;
  competitionDate: string;
  competitionLevel: string;
  sourceUrl: string;
  resultPdfUrl?: string;
  competitorKey: string;
  competitorName: string;
  club?: string;
  division: string;
  sourceDivision: string;
  hits: number;
  winningHits: number;
  fieldSize: number;
  officialPlacement?: number;
  hitPosition: number;
  percentile: number;
  winnerShare: number | null;
  note?: string;
}

export interface ImssuLeaderboardEntry {
  key: string;
  competitorKey: string;
  competitorName: string;
  club?: string;
  division: string;
  matchCount: number;
  averagePercentile: number;
  averageWinnerShare: number | null;
  averagePosition: number;
  bestHits: number;
  wins: number;
  podiums: number;
  results: ImssuFieldResult[];
}

export interface ImssuDivisionSummary {
  value: string;
  sourceLabels: string[];
  rows: number;
  competitors: number;
  fields: number;
  averageFieldSize: number;
}

export interface ImssuCompetitionSummary {
  id: string;
  name: string;
  date: string;
  location?: string;
  level?: string;
  sourceUrl: string;
  resultPdfUrl?: string;
  downloadStatus?: Competition["downloadStatus"];
  downloadError?: string;
  resultRows: number;
  rankedRows: number;
  divisions: string[];
}

export interface ImssuExcludedRow {
  competitionId: string;
  competitionName: string;
  competitorName: string;
  division?: string;
  reason: "unknown-competition" | "missing-division" | "missing-hits" | "possible-column-shift";
  detail?: string;
}

export interface ImssuStatistics {
  competitionCount: number;
  competitionsWithResults: number;
  resultRows: number;
  distinctCompetitors: number;
  representedClubs: number;
  rankedRows: number;
  rankedFields: number;
  rankedCompetitors: number;
  divisions: ImssuDivisionSummary[];
  levels: ImssuCount[];
  ageNotes: ImssuCount[];
  competitions: ImssuCompetitionSummary[];
  fieldResults: ImssuFieldResult[];
  leaderboard: ImssuLeaderboardEntry[];
  championshipWinners: ImssuFieldResult[];
  recordNotes: ImssuFieldResult[];
  largestField?: { competitionName: string; division: string; size: number };
  mostActive?: { name: string; competitions: number };
  mostVersatile?: { name: string; divisions: number };
  excludedRows: ImssuExcludedRow[];
  duplicateIdentityRows: number;
  singletonFields: number;
  singletonRows: number;
}

const nationalChampionshipPattern = /országos\s+bajnokság/i;
const missingLevelLabel = "Nincs szintadat";

/**
 * The source uses both labels for the international air-rifle event; MDLSZ invitations
 * name it "Légpuska Nemzetközi (41m)" next to the domestic 25 m event.
 */
export function canonicalImssuDivision(value?: string | null) {
  const trimmed = value?.replace(/\s+/g, " ").trim();
  if (!trimmed) return undefined;
  if (/^légpuska\s*(?:-\s*nemzetközi|nk\s*\(41\s*m\))$/i.test(trimmed)) return "Légpuska Nemzetközi (41m)";
  return trimmed;
}

export function parseImssuHits(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed && /^\d+$/.test(trimmed) ? Number(trimmed) : undefined;
}

export function imssuAgeNote(note?: string | null) {
  const compact = note?.toLocaleLowerCase("hu").replace(/\s+/g, "");
  if (!compact) return undefined;
  if (compact.includes("supersenior")) return "Super Senior";
  if (compact.includes("senior")) return "Senior";
  if (compact.includes("junior")) return "Junior";
  if (compact === "felnőtt") return "Felnőtt";
  if (compact === "nő") return "Nő";
  return undefined;
}

function counts(values: Array<string | undefined>): ImssuCount[] {
  const map = new Map<string, number>();
  for (const value of values) if (value) map.set(value, (map.get(value) ?? 0) + 1);
  return [...map].map(([value, entries]) => ({ value, entries }))
    .sort((a, b) => b.entries - a.entries || a.value.localeCompare(b.value, "hu"));
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function compareEntries(a: ImssuLeaderboardEntry, b: ImssuLeaderboardEntry) {
  return b.averagePercentile - a.averagePercentile
    || b.matchCount - a.matchCount
    || (b.averageWinnerShare ?? -1) - (a.averageWinnerShare ?? -1)
    || a.competitorName.localeCompare(b.competitorName, "hu");
}

export function rankImssuResults(results: ImssuFieldResult[]): ImssuLeaderboardEntry[] {
  const grouped = new Map<string, ImssuFieldResult[]>();
  for (const result of results) {
    const key = `${result.competitorKey}\u0000${result.division}`;
    grouped.set(key, [...(grouped.get(key) ?? []), result]);
  }
  return [...grouped].map(([key, rows]) => {
    const latest = [...rows].sort((a, b) => b.competitionDate.localeCompare(a.competitionDate))[0];
    const shares = rows.map((row) => row.winnerShare).filter((share): share is number => share !== null);
    return {
      key,
      competitorKey: latest.competitorKey,
      competitorName: latest.competitorName,
      club: latest.club,
      division: latest.division,
      matchCount: rows.length,
      averagePercentile: average(rows.map((row) => row.percentile)),
      averageWinnerShare: shares.length ? average(shares) : null,
      averagePosition: average(rows.map((row) => row.hitPosition)),
      bestHits: Math.max(...rows.map((row) => row.hits)),
      wins: rows.filter((row) => row.officialPlacement === 1).length,
      podiums: rows.filter((row) => row.officialPlacement !== undefined && row.officialPlacement <= 3).length,
      results: [...rows].sort((a, b) => a.competitionDate.localeCompare(b.competitionDate)),
    };
  }).sort(compareEntries);
}

export function buildImssuStatistics(competitions: Competition[], results: CompetitionResult[]): ImssuStatistics {
  const competitionsById = new Map(competitions.map((competition) => [competition.id, competition]));
  const fields = new Map<string, Array<{ result: CompetitionResult; hits: number; division: string }>>();
  const excludedRows: ImssuExcludedRow[] = [];
  const competitorKeys = new Set<string>();
  const clubs = new Set<string>();
  const sourceLabels = new Map<string, Set<string>>();
  const competitionsWithResults = new Set<string>();

  for (const result of results) {
    const competition = competitionsById.get(result.competitionId);
    const division = canonicalImssuDivision(result.division);
    const hits = parseImssuHits(result.rawResult);
    const base = {
      competitionId: result.competitionId,
      competitionName: competition?.name ?? result.competitionName,
      competitorName: result.competitorName,
      division: result.division ?? undefined,
    };
    if (!competition) {
      excludedRows.push({ ...base, reason: "unknown-competition" });
      continue;
    }
    if (!division) {
      excludedRows.push({ ...base, reason: "missing-division" });
      continue;
    }
    if (hits === undefined) {
      const shifted = parseImssuHits(result.rawNotes);
      excludedRows.push(shifted === undefined
        ? { ...base, reason: "missing-hits" }
        : { ...base, reason: "possible-column-shift", detail: result.rawNotes ?? undefined });
      continue;
    }
    competitionsWithResults.add(result.competitionId);
    competitorKeys.add(sourceCompetitorKey(result));
    if (result.normalizedClub || result.club) clubs.add(result.normalizedClub || result.club!);
    const labels = sourceLabels.get(division) ?? new Set<string>();
    labels.add(result.division!.replace(/\s+/g, " ").trim());
    sourceLabels.set(division, labels);
    const fieldKey = `${result.competitionId}\u0000${division}`;
    fields.set(fieldKey, [...(fields.get(fieldKey) ?? []), { result, hits, division }]);
  }

  const fieldResults: ImssuFieldResult[] = [];
  let duplicateIdentityRows = 0;
  let singletonFields = 0;
  let singletonRows = 0;
  let largestField: ImssuStatistics["largestField"];

  for (const rows of fields.values()) {
    const unique = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const key = sourceCompetitorKey(row.result);
      const current = unique.get(key);
      if (current) duplicateIdentityRows += 1;
      if (!current || row.hits > current.hits) unique.set(key, row);
    }
    const entrants = [...unique.values()];
    if (entrants.length < 2) {
      singletonFields += 1;
      singletonRows += entrants.length;
      continue;
    }
    const competition = competitionsById.get(entrants[0].result.competitionId)!;
    if (!largestField || entrants.length > largestField.size) {
      largestField = { competitionName: competition.name, division: entrants[0].division, size: entrants.length };
    }
    const n = entrants.length;
    const winningHits = Math.max(...entrants.map(({ hits }) => hits));
    for (const { result, hits, division } of entrants) {
      const higher = entrants.filter((entry) => entry.hits > hits).length;
      const tied = entrants.filter((entry) => entry.hits === hits).length;
      const hitPosition = higher + (tied + 1) / 2;
      fieldResults.push({
        competitionId: competition.id,
        competitionName: competition.name,
        competitionDate: competition.date,
        competitionLevel: competition.level?.trim() || missingLevelLabel,
        sourceUrl: competition.sourceUrl,
        resultPdfUrl: competition.resultPdfUrl,
        competitorKey: sourceCompetitorKey(result),
        competitorName: result.competitorName,
        club: result.club || result.team || undefined,
        division,
        sourceDivision: result.division!.trim(),
        hits,
        winningHits,
        fieldSize: n,
        officialPlacement: Number.isSafeInteger(result.placement) && result.placement! > 0 ? result.placement : undefined,
        hitPosition,
        percentile: Math.min(100, Math.max(0, (100 * (n - hitPosition)) / (n - 1))),
        winnerShare: winningHits > 0 ? (100 * hits) / winningHits : null,
        note: result.rawNotes?.trim() || undefined,
      });
    }
  }

  const leaderboard = rankImssuResults(fieldResults);
  const fieldKeysByDivision = new Map<string, Set<string>>();
  for (const result of fieldResults) {
    const keys = fieldKeysByDivision.get(result.division) ?? new Set<string>();
    keys.add(result.competitionId);
    fieldKeysByDivision.set(result.division, keys);
  }
  const divisions = [...fieldKeysByDivision].map(([value, fieldIds]) => {
    const rows = fieldResults.filter((result) => result.division === value);
    return {
      value,
      sourceLabels: [...(sourceLabels.get(value) ?? [])].sort((a, b) => a.localeCompare(b, "hu")),
      rows: rows.length,
      competitors: new Set(rows.map((row) => row.competitorKey)).size,
      fields: fieldIds.size,
      averageFieldSize: rows.length / fieldIds.size,
    };
  }).sort((a, b) => b.rows - a.rows || a.value.localeCompare(b.value, "hu"));

  const byCompetitor = new Map<string, { name: string; competitions: Set<string>; divisions: Set<string> }>();
  for (const result of fieldResults) {
    const entry = byCompetitor.get(result.competitorKey) ?? { name: result.competitorName, competitions: new Set(), divisions: new Set() };
    entry.competitions.add(result.competitionId);
    entry.divisions.add(result.division);
    byCompetitor.set(result.competitorKey, entry);
  }
  const people = [...byCompetitor.values()];
  const mostActive = [...people].sort((a, b) => b.competitions.size - a.competitions.size || a.name.localeCompare(b.name, "hu"))[0];
  const mostVersatile = [...people].sort((a, b) => b.divisions.size - a.divisions.size || b.competitions.size - a.competitions.size || a.name.localeCompare(b.name, "hu"))[0];

  return {
    competitionCount: competitions.length,
    competitionsWithResults: competitionsWithResults.size,
    resultRows: results.length,
    distinctCompetitors: competitorKeys.size,
    representedClubs: clubs.size,
    rankedRows: fieldResults.length,
    rankedFields: new Set(fieldResults.map((result) => `${result.competitionId}\u0000${result.division}`)).size,
    rankedCompetitors: new Set(fieldResults.map((result) => result.competitorKey)).size,
    divisions,
    levels: counts(fieldResults.map((result) => result.competitionLevel)),
    ageNotes: counts(fieldResults.map((result) => imssuAgeNote(result.note))),
    competitions: competitions.map((competition) => {
      const rows = results.filter((result) => result.competitionId === competition.id);
      const ranked = fieldResults.filter((result) => result.competitionId === competition.id);
      return {
        id: competition.id,
        name: competition.name,
        date: competition.date,
        location: competition.location,
        level: competition.level?.trim() || undefined,
        sourceUrl: competition.sourceUrl,
        resultPdfUrl: competition.resultPdfUrl,
        downloadStatus: competition.downloadStatus,
        downloadError: competition.downloadError,
        resultRows: rows.length,
        rankedRows: ranked.length,
        divisions: [...new Set(ranked.map((result) => result.division))].sort((a, b) => a.localeCompare(b, "hu")),
      };
    }),
    fieldResults,
    leaderboard,
    championshipWinners: fieldResults
      .filter((result) => nationalChampionshipPattern.test(result.competitionLevel) && result.officialPlacement === 1)
      .sort((a, b) => a.division.localeCompare(b.division, "hu")),
    recordNotes: fieldResults.filter((result) => /országos\s+csúcs/i.test(result.note ?? "")),
    largestField,
    mostActive: mostActive ? { name: mostActive.name, competitions: mostActive.competitions.size } : undefined,
    mostVersatile: mostVersatile ? { name: mostVersatile.name, divisions: mostVersatile.divisions.size } : undefined,
    excludedRows,
    duplicateIdentityRows,
    singletonFields,
    singletonRows,
  };
}
