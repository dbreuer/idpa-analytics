import type { Competition, CompetitionResult } from "@/lib/types";

export interface IpscDistributionEntry {
  value: string;
  entries: number;
}

export interface IpscMatchResult {
  competitionId: string;
  competitionName: string;
  competitionDate: string;
  competitionLevel: string;
  sourceUrl: string;
  resultPdfUrl?: string;
  competitorKey: string;
  competitorName: string;
  normalizedCompetitorName: string;
  club?: string;
  division: string;
  placement: number;
  percentile: number;
  category?: string;
  classification?: string;
  powerFactor?: string;
  resultPercentage?: number;
  rawResult?: string;
}

export interface IpscLeaderboardEntry {
  key: string;
  competitorKey: string;
  competitorName: string;
  normalizedCompetitorName: string;
  club?: string;
  division: string;
  matchCount: number;
  averagePercentile: number;
  averagePlacement: number;
  wins: number;
  podiums: number;
  bestPlacement: number;
  results: IpscMatchResult[];
}

export interface IpscCompetitionSummary {
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
  eligibleRows: number;
  divisions: string[];
}

export interface IpscStatistics {
  competitionCount: number;
  levelMatchCount: number;
  resultRows: number;
  distinctCompetitors: number;
  representedClubs: number;
  eligibleResultRows: number;
  comparableResultRows: number;
  comparableMatchDivisions: number;
  divisions: IpscDistributionEntry[];
  categories: IpscDistributionEntry[];
  classifications: IpscDistributionEntry[];
  powerFactors: IpscDistributionEntry[];
  competitions: IpscCompetitionSummary[];
  leaderboard: IpscLeaderboardEntry[];
  resultsWithoutDivision: number;
  resultsWithoutPlacement: number;
  rowsOutsideLevelMatches: number;
  duplicateIdentityRows: number;
  matchDivisionsWithoutComparison: number;
  resultPercentagesAvailable: number;
}

interface MatchGroup {
  competitionId: string;
  division: string;
  rows: CompetitionResult[];
}

const levelMatchPattern = /^level\s*[1-3]$/i;
const knownDivisionNames: Record<string, string> = {
  classic: "Classic",
  modified: "Modified",
  optics: "Optics",
  open: "Open",
  "pcc iron sight": "PCC Iron Sight",
  "pcc optics": "PCC Optics",
  "pcc optic": "PCC Optics",
  "mini rifle open": "Mini Rifle Open",
  "production": "Production",
  "production optic": "Production Optics",
  "production optics": "Production Optics",
  revolver: "Revolver",
  standard: "Standard",
  "standard manual": "Standard Manual",
};

function competitorKey(result: CompetitionResult) {
  const licenseId = result.competitorLicenseId?.trim().toUpperCase();
  const numericLicenseId = licenseId?.replace(/\D/g, "").replace(/^0+/, "");
  return numericLicenseId
    ? `license:${numericLicenseId}`
    : `name:${result.normalizedCompetitorName || result.competitorName}`;
}

function canonicalDivision(value: string) {
  const trimmed = value.trim();
  const key = trimmed.replace(/^pisztoly-/i, "").toLocaleLowerCase("en");
  return knownDivisionNames[key] ?? trimmed;
}

function distribution(values: Array<string | undefined>): IpscDistributionEntry[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, entries]) => ({ value, entries }))
    .sort((a, b) => b.entries - a.entries || a.value.localeCompare(b.value, "hu"));
}

function parsePercentage(value?: string) {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value.replace("%", "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function compareLeaderboardEntries(a: IpscLeaderboardEntry, b: IpscLeaderboardEntry) {
  return b.averagePercentile - a.averagePercentile
    || b.matchCount - a.matchCount
    || a.averagePlacement - b.averagePlacement
    || a.competitorName.localeCompare(b.competitorName, "hu");
}

export function buildIpscStatistics(
  competitions: Competition[],
  results: CompetitionResult[],
): IpscStatistics {
  const competitionsById = new Map(competitions.map((competition) => [competition.id, competition]));
  const matchGroups = new Map<string, MatchGroup>();
  const competitorKeys = new Set<string>();
  const clubs = new Set<string>();
  let resultsWithoutDivision = 0;
  let resultsWithoutPlacement = 0;
  let rowsOutsideLevelMatches = 0;
  let resultPercentagesAvailable = 0;

  for (const result of results) {
    const key = competitorKey(result);
    competitorKeys.add(key);
    if (result.normalizedClub || result.club) clubs.add(result.normalizedClub || result.club!);
    if (parsePercentage(result.resultPercentage) !== undefined) resultPercentagesAvailable += 1;

    const competition = competitionsById.get(result.competitionId);
    if (!competition || !levelMatchPattern.test(competition.level?.trim() ?? "")) {
      rowsOutsideLevelMatches += 1;
      continue;
    }
    if (!result.division) {
      resultsWithoutDivision += 1;
      continue;
    }
    if (!Number.isSafeInteger(result.placement) || !result.placement || result.placement < 1) {
      resultsWithoutPlacement += 1;
      continue;
    }

    const division = canonicalDivision(result.division);
    const groupKey = `${result.competitionId}\u0000${division}`;
    const group = matchGroups.get(groupKey) ?? {
      competitionId: result.competitionId,
      division,
      rows: [],
    };
    group.rows.push(result);
    matchGroups.set(groupKey, group);
  }

  const matchResults: IpscMatchResult[] = [];
  const leaderboardByCompetitor = new Map<string, IpscMatchResult[]>();
  let eligibleResultRows = 0;
  let comparableResultRows = 0;
  let comparableMatchDivisions = 0;
  let matchDivisionsWithoutComparison = 0;
  let duplicateIdentityRows = 0;
  const comparableMatchKeys = new Set<string>();

  for (const group of matchGroups.values()) {
    const uniqueRows = new Map<string, CompetitionResult>();
    for (const row of group.rows) {
      const key = competitorKey(row);
      const existing = uniqueRows.get(key);
      if (!existing) {
        uniqueRows.set(key, row);
      } else {
        duplicateIdentityRows += 1;
        if ((row.placement ?? Number.MAX_SAFE_INTEGER) < (existing.placement ?? Number.MAX_SAFE_INTEGER)) {
          uniqueRows.set(key, row);
        }
      }
    }

    const field = [...uniqueRows.entries()];
    eligibleResultRows += field.length;
    if (field.length < 2) {
      matchDivisionsWithoutComparison += 1;
      continue;
    }
    comparableMatchDivisions += 1;
    comparableResultRows += field.length;
    comparableMatchKeys.add(group.competitionId);
    const competition = competitionsById.get(group.competitionId)!;
    const fieldSize = field.length;
    const tiedPlacements = new Map<number, number>();
    for (const [, row] of field) {
      tiedPlacements.set(row.placement!, (tiedPlacements.get(row.placement!) ?? 0) + 1);
    }

    for (const [key, row] of field) {
      const tieCount = tiedPlacements.get(row.placement!) ?? 1;
      const averageTiePlacement = row.placement! + (tieCount - 1) / 2;
      const percentile = fieldSize === 1
        ? 100
        : Math.max(0, Math.min(100, ((fieldSize - averageTiePlacement) / (fieldSize - 1)) * 100));
      const matchResult: IpscMatchResult = {
        competitionId: group.competitionId,
        competitionName: competition.name,
        competitionDate: competition.date,
        competitionLevel: competition.level ?? "Level",
        sourceUrl: competition.sourceUrl,
        resultPdfUrl: competition.resultPdfUrl,
        competitorKey: key,
        competitorName: row.competitorName,
        normalizedCompetitorName: row.normalizedCompetitorName || row.competitorName,
        club: row.normalizedClub || row.club,
        division: group.division,
        placement: row.placement!,
        percentile: Number(percentile.toFixed(2)),
        category: row.category,
        classification: row.classification,
        powerFactor: row.powerFactor,
        resultPercentage: parsePercentage(row.resultPercentage),
        rawResult: row.rawResult,
      };
      matchResults.push(matchResult);
      const leaderboardKey = `${group.division}\u0000${key}`;
      const entries = leaderboardByCompetitor.get(leaderboardKey) ?? [];
      entries.push(matchResult);
      leaderboardByCompetitor.set(leaderboardKey, entries);
    }
  }

  const leaderboard = [...leaderboardByCompetitor.entries()]
    .map(([, entries]): IpscLeaderboardEntry => {
      const first = entries[0];
      return {
        key: `${first.division}\u0000${first.competitorKey}`,
        competitorKey: first.competitorKey,
        competitorName: first.competitorName,
        normalizedCompetitorName: first.normalizedCompetitorName,
        club: entries.find((entry) => entry.club)?.club,
        division: first.division,
        matchCount: entries.length,
        averagePercentile: Number((entries.reduce((sum, entry) => sum + entry.percentile, 0) / entries.length).toFixed(2)),
        averagePlacement: Number((entries.reduce((sum, entry) => sum + entry.placement, 0) / entries.length).toFixed(2)),
        wins: entries.filter((entry) => entry.placement === 1).length,
        podiums: entries.filter((entry) => entry.placement <= 3).length,
        bestPlacement: Math.min(...entries.map((entry) => entry.placement)),
        results: entries.sort((a, b) => a.competitionDate.localeCompare(b.competitionDate) || a.competitionName.localeCompare(b.competitionName, "hu")),
      };
    })
    .sort(compareLeaderboardEntries);

  const resultsByCompetition = new Map<string, CompetitionResult[]>();
  for (const result of results) {
    const entries = resultsByCompetition.get(result.competitionId) ?? [];
    entries.push(result);
    resultsByCompetition.set(result.competitionId, entries);
  }
  const competitionsSummary = competitions.map((competition): IpscCompetitionSummary => {
    const competitionResults = resultsByCompetition.get(competition.id) ?? [];
    const matchResultRows = matchResults.filter((result) => result.competitionId === competition.id);
    return {
      id: competition.id,
      name: competition.name,
      date: competition.date,
      location: competition.location,
      level: competition.level,
      sourceUrl: competition.sourceUrl,
      resultPdfUrl: competition.resultPdfUrl,
      downloadStatus: competition.downloadStatus,
      downloadError: competition.downloadError,
      resultRows: competitionResults.length,
      eligibleRows: matchResultRows.length,
      divisions: [...new Set(matchResultRows.map((result) => result.division))].sort((a, b) => a.localeCompare(b, "hu")),
    };
  });

  return {
    competitionCount: competitions.length,
    levelMatchCount: comparableMatchKeys.size,
    resultRows: results.length,
    distinctCompetitors: competitorKeys.size,
    representedClubs: clubs.size,
    eligibleResultRows,
    comparableResultRows,
    comparableMatchDivisions,
    divisions: distribution(matchResults.map((result) => result.division)),
    categories: distribution(matchResults.map((result) => result.category)),
    classifications: distribution(matchResults.map((result) => result.classification)),
    powerFactors: distribution(matchResults.map((result) => result.powerFactor)),
    competitions: competitionsSummary,
    leaderboard,
    resultsWithoutDivision,
    resultsWithoutPlacement,
    rowsOutsideLevelMatches,
    duplicateIdentityRows,
    matchDivisionsWithoutComparison,
    resultPercentagesAvailable,
  };
}

export function rankIpscResults(results: IpscMatchResult[]): IpscLeaderboardEntry[] {
  const grouped = new Map<string, IpscMatchResult[]>();
  for (const result of results) {
    const key = `${result.division}\u0000${result.competitorKey}`;
    const entries = grouped.get(key) ?? [];
    entries.push(result);
    grouped.set(key, entries);
  }
  return [...grouped.entries()]
    .map(([key, entries]) => {
      const first = entries[0];
      return {
        key,
        competitorKey: first.competitorKey,
        competitorName: first.competitorName,
        normalizedCompetitorName: first.normalizedCompetitorName,
        club: entries.find((entry) => entry.club)?.club,
        division: first.division,
        matchCount: entries.length,
        averagePercentile: Number((entries.reduce((sum, entry) => sum + entry.percentile, 0) / entries.length).toFixed(2)),
        averagePlacement: Number((entries.reduce((sum, entry) => sum + entry.placement, 0) / entries.length).toFixed(2)),
        wins: entries.filter((entry) => entry.placement === 1).length,
        podiums: entries.filter((entry) => entry.placement <= 3).length,
        bestPlacement: Math.min(...entries.map((entry) => entry.placement)),
        results: entries,
      } satisfies IpscLeaderboardEntry;
    })
    .sort(compareLeaderboardEntries);
}
