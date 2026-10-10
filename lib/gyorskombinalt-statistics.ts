import { sourceCompetitorKey } from "@/lib/competitor-identity";
import type { Competition, CompetitionResult } from "@/lib/types";

export const gyorskombinaltIdentity = sourceCompetitorKey;

export function buildGyorskombinaltStatistics(competitions: Competition[], results: CompetitionResult[]) {
  const knownIds = new Set(competitions.map(({ id }) => id));
  const linkedResults = results.filter((result) => knownIds.has(result.competitionId));
  const divisions = new Map<string, { rows: number; people: Set<string>; matches: Set<string> }>();
  const clubs = new Map<string, { rows: number; people: Set<string> }>();
  const people = new Map<string, { key: string; name: string; rows: number; matches: Set<string>; divisions: Set<string> }>();
  const months = new Map<string, number>();
  for (const result of linkedResults) {
    const key = gyorskombinaltIdentity(result);
    const person = people.get(key) ?? {
      key, name: result.competitorName, rows: 0, matches: new Set<string>(), divisions: new Set<string>(),
    };
    person.rows += 1;
    person.matches.add(result.competitionId);
    if (result.division) person.divisions.add(result.division);
    people.set(key, person);
    const division = result.division || "Nincs divízióadat";
    const field = divisions.get(division) ?? { rows: 0, people: new Set<string>(), matches: new Set<string>() };
    field.rows += 1;
    field.people.add(key);
    field.matches.add(result.competitionId);
    divisions.set(division, field);
    const club = result.club || result.team;
    if (club) {
      const entry = clubs.get(club) ?? { rows: 0, people: new Set<string>() };
      entry.rows += 1;
      entry.people.add(key);
      clubs.set(club, entry);
    }
  }
  for (const competition of competitions) {
    const month = /^(\d{4}-(?:0[1-9]|1[0-2]))-\d{2}(?:$| )/.exec(competition.date)?.[1];
    if (month) months.set(month, (months.get(month) ?? 0) + 1);
  }
  return {
    linkedResults,
    unlinkedRows: results.length - linkedResults.length,
    people: [...people.values()].map((person) => ({
      key: person.key, name: person.name, rows: person.rows,
      matches: person.matches.size, divisions: [...person.divisions].sort((a, b) => a.localeCompare(b, "hu")),
    })).sort((a, b) => b.matches - a.matches || b.rows - a.rows || a.name.localeCompare(b.name, "hu")),
    divisions: [...divisions].map(([name, field]) => ({
      name, rows: field.rows, people: field.people.size, matches: field.matches.size,
    })).sort((a, b) => b.rows - a.rows || a.name.localeCompare(b.name, "hu")),
    clubs: [...clubs].map(([name, club]) => ({ name, rows: club.rows, people: club.people.size }))
      .sort((a, b) => b.rows - a.rows || a.name.localeCompare(b.name, "hu")),
    months: [...months].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count })),
    undatedCompetitions: competitions.filter(({ date }) => !/^\d{4}-(?:0[1-9]|1[0-2])-\d{2}(?:$| )/.test(date)).length,
    competitions: competitions.map((competition) => {
      const rows = linkedResults.filter(({ competitionId }) => competitionId === competition.id);
      return { ...competition, rows: rows.length, people: new Set(rows.map(gyorskombinaltIdentity)).size };
    }),
  };
}
