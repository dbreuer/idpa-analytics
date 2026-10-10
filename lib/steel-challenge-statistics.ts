import { sourceCompetitorKey } from "@/lib/competitor-identity";
import type { Competition, CompetitionResult } from "@/lib/types";

export interface SteelChallengeCount {
  value: string;
  entries: number;
}

export interface SteelChallengeResult {
  competitionId: string;
  competitionDate: string;
  competitorKey: string;
  competitorName: string;
  club?: string;
  division: string;
  placement: number;
  percentile: number;
  fieldSize: number;
  rawResult?: string;
  parsedResult?: number;
  winningResult?: number;
  winnerShare: number | null;
  note?: string;
}

export interface SteelChallengeLeaderboardEntry {
  key: string;
  competitorKey: string;
  competitorName: string;
  club?: string;
  division: string;
  matchCount: number;
  averagePercentile: number;
  averagePlacement: number;
  averageWinnerShare: number | null;
  wins: number;
  podiums: number;
  bestPlacement: number;
  bestResult?: number;
  results: SteelChallengeResult[];
}

export interface SteelChallengeCompetitionSummary {
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

export interface SteelChallengeExcludedRow {
  competitionId: string;
  competitionName: string;
  competitorName: string;
  division?: string;
  reason: "unknown-competition" | "missing-division" | "missing-placement";
  detail?: string;
}

export interface SteelChallengeStatistics {
  competitionCount: number;
  competitionsWithResults: number;
  resultRows: number;
  distinctCompetitors: number;
  representedClubs: number;
  rankedRows: number;
  rankedFields: number;
  rankedCompetitors: number;
  divisions: SteelChallengeCount[];
  levels: SteelChallengeCount[];
  competitions: SteelChallengeCompetitionSummary[];
  fieldResults: SteelChallengeResult[];
  championshipWinners: SteelChallengeResult[];
  largestField?: { competitionName: string; division: string; size: number };
  mostActive?: { name: string; competitions: number };
  mostVersatile?: { name: string; divisions: number };
  excludedRows: SteelChallengeExcludedRow[];
  duplicateIdentityRows: number;
  singletonFields: number;
  singletonRows: number;
  resultsWithRawValue: number;
}

const nationalChampionshipPattern = /országos\s+bajnokság/i;
const missingLevelLabel = "Nincs szintadat";

function parseResultValue(value?: string | null) {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function countValues(values: Array<string | undefined>) {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, entries]) => ({ value, entries }))
    .sort((a, b) => b.entries - a.entries || a.value.localeCompare(b.value, "hu"));
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function compareEntries(a: SteelChallengeLeaderboardEntry, b: SteelChallengeLeaderboardEntry) {
  return b.averagePercentile - a.averagePercentile
    || b.matchCount - a.matchCount
    || a.averagePlacement - b.averagePlacement
    || (b.averageWinnerShare ?? -1) - (a.averageWinnerShare ?? -1)
    || a.competitorName.localeCompare(b.competitorName, "hu");
}

export function rankSteelChallengeResults(results: SteelChallengeResult[]): SteelChallengeLeaderboardEntry[] {
  const grouped = new Map<string, SteelChallengeResult[]>();
  for (const result of results) {
    const key = `${result.competitorKey}\u0000${result.division}`;
    grouped.set(key, [...(grouped.get(key) ?? []), result]);
  }
  return [...grouped].map(([key, rows]) => {
    const latest = [...rows].sort((a, b) => b.competitionDate.localeCompare(a.competitionDate))[0];
    const winnerShares = rows.map((row) => row.winnerShare).filter((share): share is number => share !== null);
    const resultValues = rows.map((row) => row.parsedResult).filter((value): value is number => value !== undefined);
    return {
      key,
      competitorKey: latest.competitorKey,
      competitorName: latest.competitorName,
      club: latest.club,
      division: latest.division,
      matchCount: rows.length,
      averagePercentile: average(rows.map((row) => row.percentile)),
      averagePlacement: average(rows.map((row) => row.placement)),
      averageWinnerShare: winnerShares.length ? average(winnerShares) : null,
      wins: rows.filter((row) => row.placement === 1).length,
      podiums: rows.filter((row) => row.placement <= 3).length,
      bestPlacement: Math.min(...rows.map((row) => row.placement)),
      bestResult: resultValues.length ? Math.max(...resultValues) : undefined,
      results: [...rows].sort((a, b) => a.competitionDate.localeCompare(b.competitionDate)),
    };
  }).sort(compareEntries);
}

export function buildSteelChallengeStatistics(competitions: Competition[], results: CompetitionResult[]): SteelChallengeStatistics {
  const competitionsById = new Map(competitions.map((competition) => [competition.id, competition]));
  const fields = new Map<string, CompetitionResult[]>();
  const excludedRows: SteelChallengeExcludedRow[] = [];
  const competitorKeys = new Set<string>();
  const clubs = new Set<string>();
  const competitionsWithResults = new Set<string>();
  let resultsWithRawValue = 0;

  for (const result of results) {
    const competition = competitionsById.get(result.competitionId);
    const division = result.division?.trim();
    const placement = result.placement;
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
    if (!Number.isSafeInteger(placement) || !placement || placement < 1) {
      excludedRows.push({
        ...base,
        reason: "missing-placement",
        detail: result.rawPlacement || undefined,
      });
      continue;
    }
    if (parseResultValue(result.rawResult) !== undefined) resultsWithRawValue += 1;
    competitionsWithResults.add(result.competitionId);
    competitorKeys.add(sourceCompetitorKey(result));
    if (result.normalizedClub || result.club) clubs.add(result.normalizedClub || result.club!);
    const fieldKey = `${result.competitionId}\u0000${division}`;
    fields.set(fieldKey, [...(fields.get(fieldKey) ?? []), result]);
  }

  const fieldResults: SteelChallengeResult[] = [];
  let duplicateIdentityRows = 0;
  let singletonFields = 0;
  let singletonRows = 0;
  let largestField: SteelChallengeStatistics["largestField"];

  for (const rows of fields.values()) {
    const unique = new Map<string, CompetitionResult>();
    for (const row of rows) {
      const key = sourceCompetitorKey(row);
      const current = unique.get(key);
      if (current) duplicateIdentityRows += 1;
      if (!current || (row.placement ?? Number.MAX_SAFE_INTEGER) < (current.placement ?? Number.MAX_SAFE_INTEGER)) {
        unique.set(key, row);
      }
    }
    const entrants = [...unique.values()];
    if (entrants.length < 2) {
      singletonFields += 1;
      singletonRows += entrants.length;
      continue;
    }
    const competition = competitionsById.get(entrants[0].competitionId)!;
    const division = entrants[0].division!.trim();
    if (!largestField || entrants.length > largestField.size) {
      largestField = { competitionName: competition.name, division, size: entrants.length };
    }
    const n = entrants.length;
    const resultValues = entrants.map((row) => parseResultValue(row.rawResult)).filter((value): value is number => value !== undefined);
    const winningResult = resultValues.length ? Math.max(...resultValues) : undefined;
    const tiedPlacements = new Map<number, number>();
    for (const row of entrants) {
      tiedPlacements.set(row.placement!, (tiedPlacements.get(row.placement!) ?? 0) + 1);
    }
    for (const row of entrants) {
      const tieCount = tiedPlacements.get(row.placement!) ?? 1;
      const averagedPlacement = row.placement! + (tieCount - 1) / 2;
      const parsedResult = parseResultValue(row.rawResult);
      fieldResults.push({
        competitionId: competition.id,
        competitionDate: competition.date,
        competitorKey: sourceCompetitorKey(row),
        competitorName: row.competitorName,
        club: row.normalizedClub || row.club || row.team || undefined,
        division,
        placement: row.placement!,
        percentile: Math.max(0, Math.min(100, (100 * (n - averagedPlacement)) / (n - 1))),
        fieldSize: n,
        rawResult: row.rawResult,
        parsedResult,
        winningResult,
        winnerShare: parsedResult !== undefined && winningResult && winningResult > 0
          ? (100 * parsedResult) / winningResult
          : null,
        note: row.rawNotes?.trim() || undefined,
      });
    }
  }

  const fieldKeysByDivision = new Map<string, Set<string>>();
  for (const result of fieldResults) {
    const keys = fieldKeysByDivision.get(result.division) ?? new Set<string>();
    keys.add(result.competitionId);
    fieldKeysByDivision.set(result.division, keys);
  }

  const byCompetitor = new Map<string, { name: string; competitions: Set<string>; divisions: Set<string> }>();
  for (const result of fieldResults) {
    const entry = byCompetitor.get(result.competitorKey) ?? { name: result.competitorName, competitions: new Set(), divisions: new Set() };
    entry.competitions.add(result.competitionId);
    entry.divisions.add(result.division);
    byCompetitor.set(result.competitorKey, entry);
  }
  const people = [...byCompetitor.values()];
  const mostActive = [...people]
    .sort((a, b) => b.competitions.size - a.competitions.size || a.name.localeCompare(b.name, "hu"))[0];
  const mostVersatile = [...people]
    .sort((a, b) => b.divisions.size - a.divisions.size || b.competitions.size - a.competitions.size || a.name.localeCompare(b.name, "hu"))[0];

  return {
    competitionCount: competitions.length,
    competitionsWithResults: competitionsWithResults.size,
    resultRows: results.length,
    distinctCompetitors: competitorKeys.size,
    representedClubs: clubs.size,
    rankedRows: fieldResults.length,
    rankedFields: new Set(fieldResults.map((result) => `${result.competitionId}\u0000${result.division}`)).size,
    rankedCompetitors: new Set(fieldResults.map((result) => result.competitorKey)).size,
    divisions: countValues(fieldResults.map((result) => result.division)),
    levels: countValues(fieldResults.map((result) => {
      const competition = competitionsById.get(result.competitionId);
      return competition?.level?.trim() || missingLevelLabel;
    })),
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
    championshipWinners: fieldResults
      .filter((result) => nationalChampionshipPattern.test(competitionsById.get(result.competitionId)?.level ?? "") && result.placement === 1)
      .sort((a, b) => a.division.localeCompare(b.division, "hu")),
    largestField,
    mostActive: mostActive ? { name: mostActive.name, competitions: mostActive.competitions.size } : undefined,
    mostVersatile: mostVersatile ? { name: mostVersatile.name, divisions: mostVersatile.divisions.size } : undefined,
    excludedRows,
    duplicateIdentityRows,
    singletonFields,
    singletonRows,
    resultsWithRawValue,
  };
}
