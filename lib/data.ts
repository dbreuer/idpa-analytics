import fs from "node:fs";
import path from "node:path";

import { buildStatistics } from "@/lib/statistics";
import type {
  CompetitionDiscoveryFile,
  QualityFile,
  ResultsFile,
  StatisticsFile,
} from "@/lib/types";

const dataDirectory = path.join(process.cwd(), "data");
const seasonFiles = ["competitions.json", "results.json", "data-quality.json", "statistics.json"];

function readJsonFile<T>(directory: string, fileName: string): T {
  return JSON.parse(fs.readFileSync(path.join(directory, fileName), "utf8")) as T;
}

function isCompleteSeason(directory: string) {
  return seasonFiles.every((fileName) => fs.existsSync(path.join(directory, fileName)));
}

function legacyYear(): number | null {
  if (!isCompleteSeason(dataDirectory)) return null;
  const discovery = readJsonFile<CompetitionDiscoveryFile>(dataDirectory, "competitions.json");
  const year = discovery.year ?? Number(new URL(discovery.sourceUrl).searchParams.get("year"));
  const dates = new Set(discovery.competitions.map((competition) => Number(competition.date.slice(0, 4))));
  const inferredYear = year || (dates.size === 1 ? [...dates][0] : null);
  if (!inferredYear || !Number.isInteger(inferredYear) || inferredYear < 1000 || inferredYear > 9999) {
    throw new Error("Cannot determine the legacy data season. Generate yearly data with --year.");
  }
  if ([...dates].some((dateYear) => dateYear !== inferredYear)) {
    throw new Error("Legacy competition data contains multiple seasons. Generate each year separately.");
  }
  return inferredYear;
}

export function getAvailableYears(): number[] {
  if (!fs.existsSync(dataDirectory)) return [];
  const years = fs.readdirSync(dataDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^[1-9]\d{3}$/.test(entry.name))
    .filter((entry) => {
      if (isCompleteSeason(path.join(dataDirectory, entry.name))) return true;
      console.warn(`Season ${entry.name} is incomplete. Run all pipeline stages before publishing it.`);
      return false;
    })
    .map((entry) => Number(entry.name));
  const legacy = legacyYear();
  if (legacy !== null && !fs.existsSync(path.join(dataDirectory, String(legacy)))) years.push(legacy);
  return [...new Set(years)].sort((a, b) => b - a);
}

export function loadDashboardData(year: number) {
  if (!getAvailableYears().includes(year)) {
    throw new Error(`Season ${year} is not available.`);
  }
  const seasonDirectory = path.join(dataDirectory, String(year));
  const directory = fs.existsSync(seasonDirectory) ? seasonDirectory : dataDirectory;
  const competitionsFile = readJsonFile<CompetitionDiscoveryFile>(directory, "competitions.json");
  const resultsFile = readJsonFile<ResultsFile>(directory, "results.json");
  const qualityFile = readJsonFile<QualityFile>(directory, "data-quality.json");
  const aliases = readJsonFile<Record<string, string>>(dataDirectory, "club-aliases.json");
  const statisticsFile = readJsonFile<StatisticsFile>(directory, "statistics.json");

  for (const file of [competitionsFile, resultsFile, qualityFile, statisticsFile]) {
    if (file.year !== undefined && file.year !== year) {
      throw new Error(`Season metadata does not match the requested year ${year}.`);
    }
  }
  if (competitionsFile.competitions.some((competition) => Number(competition.date.slice(0, 4)) !== year)
    || resultsFile.results.some((result) => Number(result.competitionDate.slice(0, 4)) !== year)) {
    throw new Error(`Season ${year} contains competition or result dates from another year.`);
  }

  const statistics = buildStatistics(competitionsFile.competitions, resultsFile.results, {
    clubAliases: aliases,
  });

  return {
    year,
    competitionsFile,
    resultsFile,
    qualityFile,
    aliases,
    statistics,
    statisticsFile,
  };
}
