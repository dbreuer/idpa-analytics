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

function readJsonFile<T>(fileName: string, fallback: T) {
  try {
    const filePath = path.join(dataDirectory, fileName);
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function loadDashboardData() {
  const competitionsFile = readJsonFile<CompetitionDiscoveryFile>("competitions.json", {
    generatedAt: null,
    sourceUrl: "https://mdlsz.com/versenynaptar-2025/",
    discoveredCount: 0,
    competitions: [],
    errors: ["Competition discovery data not generated yet."],
  });
  const resultsFile = readJsonFile<ResultsFile>("results.json", {
    generatedAt: null,
    results: [],
    parsingErrors: [],
    ambiguousCompetitors: [],
  });
  const qualityFile = readJsonFile<QualityFile>("data-quality.json", {
    generatedAt: null,
    quality: {
      totalPdfsDiscovered: 0,
      successfullyProcessedPdfs: 0,
      failedPdfs: 0,
      totalExtractedRows: 0,
      validCompetitorRows: 0,
      rowsWithValidTime: 0,
      rowsWithMissingTeam: 0,
      rowsWithParsingErrors: 0,
    },
    errors: [],
  });
  const aliases = readJsonFile<Record<string, string>>("club-aliases.json", {});
  const statisticsFile = readJsonFile<StatisticsFile>("statistics.json", {
    generatedAt: null,
    statistics: null,
    errors: [],
  });

  const statistics = buildStatistics(competitionsFile.competitions, resultsFile.results, {
    clubAliases: aliases,
  });

  return {
    competitionsFile,
    resultsFile,
    qualityFile,
    aliases,
    statistics,
    statisticsFile,
  };
}
