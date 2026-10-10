import type { CompetitionResult } from "@/lib/types";

export interface DivisionEntryCount {
  division: string;
  entries: number;
}

export interface DisciplineSourceSummary {
  resultRows: number;
  distinctNameIdentifiers: number;
  representedClubs: number;
  divisionCounts: DivisionEntryCount[];
  rowsWithoutDivision: number;
}

export function summarizeSourceResults(results: CompetitionResult[]): DisciplineSourceSummary {
  const nameIdentifiers = new Set<string>();
  const clubs = new Set<string>();
  const divisionCounts = new Map<string, number>();
  let rowsWithoutDivision = 0;

  for (const result of results) {
    const nameIdentifier = result.normalizedCompetitorName || result.competitorName;
    if (nameIdentifier) nameIdentifiers.add(nameIdentifier);

    const club = result.normalizedClub || result.club;
    if (club) clubs.add(club);

    if (result.division) {
      divisionCounts.set(result.division, (divisionCounts.get(result.division) ?? 0) + 1);
    } else {
      rowsWithoutDivision += 1;
    }
  }

  return {
    resultRows: results.length,
    distinctNameIdentifiers: nameIdentifiers.size,
    representedClubs: clubs.size,
    divisionCounts: [...divisionCounts.entries()]
      .map(([division, entries]) => ({ division, entries }))
      .sort((a, b) => a.division.localeCompare(b.division, "hu")),
    rowsWithoutDivision,
  };
}
