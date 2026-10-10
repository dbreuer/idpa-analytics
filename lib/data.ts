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
const ingestionFiles = [
  "competitions.json",
  "raw-extracted-results.json",
  "results.json",
  "data-quality.json",
];

function readJsonFile<T>(directory: string, fileName: string): T {
  return JSON.parse(fs.readFileSync(path.join(directory, fileName), "utf8")) as T;
}

function isCompleteSeason(directory: string, hasAnalytics: boolean) {
  const hasIngestionFiles = ingestionFiles.every((fileName) => fs.existsSync(path.join(directory, fileName)));
  const hasStatistics = fs.existsSync(path.join(directory, "statistics.json"));
  return hasIngestionFiles && (hasAnalytics ? hasStatistics : !hasStatistics);
}

export function getAvailableYears(discipline: DisciplineSlug): number[] {
  const definition = getDiscipline(discipline);
  if (!definition) return [];

  const disciplineDirectory = path.join(dataDirectory, discipline);
  if (!fs.existsSync(disciplineDirectory)) return [];
  return fs.readdirSync(disciplineDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^[1-9]\d{3}$/.test(entry.name))
    .filter((entry) => {
      if (isCompleteSeason(path.join(disciplineDirectory, entry.name), definition.analytics === "idpa")) return true;
      console.warn(`Season ${entry.name} for ${discipline} is incomplete and will not be published.`);
      return false;
    })
    .map((entry) => Number(entry.name))
    .sort((a, b) => b - a);
}

export function getDisciplinesWithData() {
  return disciplineDefinitions.filter((discipline) => getAvailableYears(discipline.slug).length > 0);
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
  if (!definition) throw new Error(`Unknown discipline: ${discipline}`);
  if (!getAvailableYears(discipline).includes(year)) {
    throw new Error(`Season ${year} for ${discipline} is not available.`);
  }

  const directory = path.join(dataDirectory, discipline, String(year));
  const competitionsFile = readJsonFile<CompetitionDiscoveryFile>(directory, "competitions.json");
  const resultsFile = readJsonFile<ResultsFile>(directory, "results.json");
  const qualityFile = readJsonFile<QualityFile>(directory, "data-quality.json");
  const statisticsPath = path.join(directory, "statistics.json");
  const statisticsFile = fs.existsSync(statisticsPath)
    ? readJsonFile<StatisticsFile>(directory, "statistics.json")
    : null;
  const aliases = readJsonFile<Record<string, string>>(dataDirectory, "club-aliases.json");

  const files = [
    ["competitions.json", competitionsFile],
    ["results.json", resultsFile],
    ["data-quality.json", qualityFile],
    ...(statisticsFile ? [["statistics.json", statisticsFile] as const] : []),
  ] as const;
  for (const [label, file] of files) {
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

  const statistics = definition.analytics === "idpa"
    ? buildStatistics(competitionsFile.competitions, resultsFile.results, {
        clubAliases: aliases,
      })
    : null;

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
