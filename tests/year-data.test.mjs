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
      : { "node:fs": fs, "node:path": path }[name],
  });
  return { data, warnings, ...exports };
}

function writeSeason(directory, year) {
  fs.mkdirSync(directory, { recursive: true });
  const files = {
    "competitions.json": {
      year,
      sourceUrl: `https://portal.mdlsz.com/racecalendar?year=${year}`,
      competitions: [{ id: `race-${year}`, date: `${year}.05.01` }],
    },
    "results.json": { year, results: [{ competitionId: `race-${year}`, competitionDate: `${year}.05.01` }] },
    "data-quality.json": { year, quality: {} },
    "statistics.json": { year, statistics: {} },
  };
  for (const [name, value] of Object.entries(files)) {
    fs.writeFileSync(path.join(directory, name), JSON.stringify(value));
  }
}

test("discovers complete seasons newest first and never combines their results", (t) => {
  const app = fixture(t);
  writeSeason(path.join(app.data, "2025"), 2025);
  writeSeason(path.join(app.data, "2026"), 2026);
  fs.mkdirSync(path.join(app.data, "2027"));
  assert.deepEqual(Array.from(app.getAvailableYears()), [2026, 2025]);
  assert.match(app.warnings[0], /2027.*incomplete/);
  for (const year of [2025, 2026]) {
    const data = app.loadDashboardData(year);
    assert.equal(data.year, year);
    assert.equal(data.statistics.results.length, 1);
    assert.equal(data.statistics.results[0].competitionId, `race-${year}`);
    assert.equal(data.statistics.options.clubAliases.Club, "Shared Club");
  }
  assert.throws(() => app.loadDashboardData(2024), /not available/);
});

test("keeps legacy data readable without relabeling it as another year", (t) => {
  const app = fixture(t);
  writeSeason(app.data, 2026);
  const file = path.join(app.data, "competitions.json");
  const discovery = JSON.parse(fs.readFileSync(file));
  delete discovery.year;
  fs.writeFileSync(file, JSON.stringify(discovery));
  assert.deepEqual(Array.from(app.getAvailableYears()), [2026]);
  assert.equal(app.loadDashboardData(2026).resultsFile.results[0].competitionId, "race-2026");
  assert.throws(() => app.loadDashboardData(2025), /not available/);
  writeSeason(path.join(app.data, "2026"), 2026);
  fs.writeFileSync(path.join(app.data, "2026/results.json"), JSON.stringify({ year: 2026, results: [] }));
  assert.equal(app.loadDashboardData(2026).resultsFile.results.length, 0);
});

test("incomplete yearly data never falls back to stale legacy files", (t) => {
  const app = fixture(t);
  writeSeason(app.data, 2026);
  fs.mkdirSync(path.join(app.data, "2026"));
  assert.deepEqual(Array.from(app.getAvailableYears()), []);
});

test("empty data has no published years", (t) => {
  const app = fixture(t);
  assert.deepEqual(Array.from(app.getAvailableYears()), []);
});

test("malformed JSON and mismatched seasons fail explicitly", (t) => {
  const app = fixture(t);
  const directory = path.join(app.data, "2025");
  writeSeason(directory, 2025);
  fs.writeFileSync(path.join(directory, "results.json"), "{invalid");
  assert.throws(() => app.loadDashboardData(2025), /JSON/);
  writeSeason(directory, 2025);
  fs.writeFileSync(path.join(directory, "results.json"), JSON.stringify({ year: 2026, results: [] }));
  assert.throws(() => app.loadDashboardData(2025), /metadata.*2025/);
  fs.writeFileSync(path.join(directory, "results.json"), JSON.stringify({
    year: 2025,
    results: [{ competitionDate: "2026.05.01" }],
  }));
  assert.throws(() => app.loadDashboardData(2025), /another year/);
});
