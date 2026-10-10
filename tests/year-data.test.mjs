import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../lib/data.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "idpa-year-data-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const data = path.join(root, "data");
  fs.mkdirSync(data);
  fs.writeFileSync(path.join(data, "club-aliases.json"), JSON.stringify({ Club: "Shared Club" }));
  const exports = {};
  const warnings = [];
  vm.runInNewContext(compiled, {
    exports,
    URL,
    process: { cwd: () => root },
    console: { warn: (message) => warnings.push(message) },
    require: (name) => name === "@/lib/statistics"
      ? { buildStatistics: (competitions, results, options) => ({ competitions, results, options }) }
      : name === "@/lib/disciplines"
        ? {
            disciplineDefinitions: [
              { slug: "idpa", published: true, analytics: "idpa" },
              { slug: "ipsc", published: false, analytics: "unsupported" },
            ],
            getDiscipline: (slug) => slug === "idpa"
              ? { slug: "idpa", published: true, analytics: "idpa" }
              : slug === "ipsc" ? { slug: "ipsc", published: false, analytics: "unsupported" } : undefined,
            isDisciplineSlug: (slug) => ["idpa", "ipsc"].includes(slug),
          }
      : { "node:fs": fs, "node:path": path }[name],
  });
  return { data, warnings, ...exports };
}

function writeSeason(directory, year, discipline = "idpa") {
  fs.mkdirSync(directory, { recursive: true });
  const files = {
    "competitions.json": {
      discipline,
      year,
      schemaVersion: 1,
      sourceUrl: `https://portal.mdlsz.com/racecalendar?year=${year}`,
      competitions: [{ id: `race-${year}`, date: `${year}.05.01` }],
    },
    "raw-extracted-results.json": { discipline, year, schemaVersion: 1, extractions: [] },
    "results.json": { discipline, year, schemaVersion: 1, results: [{ competitionId: `race-${year}`, competitionDate: `${year}.05.01` }] },
    "data-quality.json": { discipline, year, schemaVersion: 1, quality: {} },
  };
  if (discipline === "idpa") {
    files["statistics.json"] = { discipline, year, schemaVersion: 1, statistics: {} };
  }
  for (const [name, value] of Object.entries(files)) {
    fs.writeFileSync(path.join(directory, name), JSON.stringify(value));
  }
}

test("discovers complete seasons newest first and never combines their results", (t) => {
  const app = fixture(t);
  writeSeason(path.join(app.data, "idpa", "2025"), 2025);
  writeSeason(path.join(app.data, "idpa", "2026"), 2026);
  fs.mkdirSync(path.join(app.data, "idpa", "2027"), { recursive: true });
  assert.deepEqual(Array.from(app.getAvailableYears("idpa")), [2026, 2025]);
  assert.match(app.warnings[0], /2027.*incomplete/);
  for (const year of [2025, 2026]) {
    const data = app.loadDashboardData("idpa", year);
    assert.equal(data.year, year);
    assert.equal(data.statistics.results.length, 1);
    assert.equal(data.statistics.results[0].competitionId, `race-${year}`);
    assert.equal(data.statistics.options.clubAliases.Club, "Shared Club");
  }
  assert.throws(() => app.loadDashboardData("idpa", 2024), /not available/);
});

test("publishes source-backed ingestion seasons without generating IDPA statistics", (t) => {
  const app = fixture(t);
  writeSeason(app.data, 2026);
  writeSeason(path.join(app.data, "ipsc", "2026"), 2026, "ipsc");
  assert.deepEqual(Array.from(app.getAvailableYears("idpa")), []);
  assert.deepEqual(Array.from(app.getAvailableYears("ipsc")), [2026]);
  assert.deepEqual(
    Array.from(app.getDisciplinesWithData(), ({ slug }) => slug),
    ["ipsc"],
  );
  assert.throws(() => app.loadDashboardData("idpa", 2026), /not available/);
  const ingestion = app.loadDashboardData("ipsc", 2026);
  assert.equal(ingestion.statistics, null);
  assert.equal(ingestion.statisticsFile, null);
  assert.equal(ingestion.resultsFile.results.length, 1);
  assert.throws(() => app.loadDashboardData("../idpa", 2026), /Unknown discipline/);
});

test("incomplete yearly data never falls back to stale legacy files", (t) => {
  const app = fixture(t);
  writeSeason(path.join(app.data, "idpa", "2026"), 2026);
  fs.mkdirSync(path.join(app.data, "idpa", "2027"), { recursive: true });
  assert.deepEqual(Array.from(app.getAvailableYears("idpa")), [2026]);
});

test("empty data has no published years", (t) => {
  const app = fixture(t);
  assert.deepEqual(Array.from(app.getAvailableYears("idpa")), []);
});

test("malformed JSON and mismatched seasons fail explicitly", (t) => {
  const app = fixture(t);
  const directory = path.join(app.data, "idpa", "2025");
  writeSeason(directory, 2025);
  fs.writeFileSync(path.join(directory, "results.json"), "{invalid");
  assert.throws(() => app.loadDashboardData("idpa", 2025), /JSON/);
  writeSeason(directory, 2025);
  fs.writeFileSync(path.join(directory, "results.json"), JSON.stringify({ discipline: "idpa", year: 2026, schemaVersion: 1, results: [] }));
  assert.throws(() => app.loadDashboardData("idpa", 2025), /metadata.*2025/);
  fs.writeFileSync(path.join(directory, "results.json"), JSON.stringify({
    discipline: "idpa",
    year: 2025,
    schemaVersion: 1,
    results: [{ competitionDate: "2026.05.01" }],
  }));
  assert.throws(() => app.loadDashboardData("idpa", 2025), /another year/);
});
