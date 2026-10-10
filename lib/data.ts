import fs from "node:fs";
import path from "node:path";

import { buildStatistics } from "@/lib/statistics";
import { disciplineDefinitions, getDiscipline, isDisciplineSlug, type DisciplineSlug } from "@/lib/disciplines";
import type {
  CompetitionDiscoveryFile,
  QualityFile,
  ResultsFile,
  StatisticsFile,
} from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const seasonFiles = [
  "competitions.json",
  "raw-extracted-results.json",
  "results.json",
  "data-quality.json",
  "statistics.json",
];

function readJsonFile<T>(directory: string, fileName: string): T {
  return JSON.parse(fs.readFileSync(path.join(directory, fileName), "utf8")) as T;
}

function isCompleteSeason(directory: string) {
  return seasonFiles.every((fileName) => fs.existsSync(path.join(directory, fileName)));
}

export function getAvailableYears(discipline: DisciplineSlug): number[] {
  const definition = getDiscipline(discipline);
  if (!definition || !definition.published) return [];

  const disciplineDirectory = path.join(dataDirectory, discipline);
  if (!fs.existsSync(disciplineDirectory)) return [];
  return fs.readdirSync(disciplineDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^[1-9]\d{3}$/.test(entry.name))
    .filter((entry) => {
      if (isCompleteSeason(path.join(disciplineDirectory, entry.name))) return true;
      console.warn(`Season ${entry.name} for ${discipline} is incomplete and will not be published.`);
      return false;
    })
    .map((entry) => Number(entry.name))
    .sort((a, b) => b - a);
}

export function getPublishedDisciplines() {
  return disciplineDefinitions.filter(
    (discipline) => discipline.published && getAvailableYears(discipline.slug).length > 0,
  );
}

export function loadDashboardData(discipline: string, year: number) {
  if (!isDisciplineSlug(discipline)) {
    throw new Error(`Unknown discipline: ${discipline}`);
  }
  const definition = getDiscipline(discipline);
  if (!definition?.published) {
    throw new Error(`Discipline ${discipline} does not have a published analytics adapter.`);
  }
  if (!getAvailableYears(discipline).includes(year)) {
    throw new Error(`Season ${year} for ${discipline} is not available.`);
  }

  const directory = path.join(dataDirectory, discipline, String(year));
  const competitionsFile = readJsonFile<CompetitionDiscoveryFile>(directory, "competitions.json");
  const resultsFile = readJsonFile<ResultsFile>(directory, "results.json");
  const qualityFile = readJsonFile<QualityFile>(directory, "data-quality.json");
  const statisticsFile = readJsonFile<StatisticsFile>(directory, "statistics.json");
  const aliases = readJsonFile<Record<string, string>>(dataDirectory, "club-aliases.json");

  for (const [label, file] of [
    ["competitions.json", competitionsFile],
    ["results.json", resultsFile],
    ["data-quality.json", qualityFile],
    ["statistics.json", statisticsFile],
  ] as const) {
    if (file.discipline !== discipline) {
      throw new Error(`${label} discipline metadata does not match ${discipline}.`);
    }
    if (file.year !== year) {
      throw new Error(`${label} season metadata does not match ${year}.`);
    }
    if (file.schemaVersion !== 1) {
      throw new Error(`${label} has an unsupported or missing schema version.`);
    }
  }
  if (competitionsFile.competitions.some((competition) => Number(competition.date.slice(0, 4)) !== year)
    || resultsFile.results.some((result) => Number(result.competitionDate.slice(0, 4)) !== year)) {
    throw new Error(`Season ${year} for ${discipline} contains competition or result dates from another year.`);
  }

  const statistics = buildStatistics(competitionsFile.competitions, resultsFile.results, {
    clubAliases: aliases,
  });

  return {
    discipline: definition,
    year,
    competitionsFile,
    resultsFile,
    qualityFile,
    aliases,
    statistics,
    statisticsFile,
  };
}
