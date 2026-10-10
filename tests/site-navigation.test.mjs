import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";

const navigationSource = fs.readFileSync(new URL("../lib/site-navigation.ts", import.meta.url), "utf8");
const associationsSource = fs.readFileSync(new URL("../lib/associations.ts", import.meta.url), "utf8");
const dashboardSource = fs.readFileSync(new URL("../components/dashboard/dashboard-app.tsx", import.meta.url), "utf8");
const headerSource = fs.readFileSync(new URL("../components/dashboard/dashboard-header.tsx", import.meta.url), "utf8");
function loadModule(source) {
  const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: createRequire(import.meta.url), Intl });
  return exports;
}
const navigation = loadModule(navigationSource);
const associations = loadModule(associationsSource);
const utils = loadModule(fs.readFileSync(new URL("../lib/utils.ts", import.meta.url), "utf8"));

test("Hungarian labels preserve section identifiers and cover desktop and mobile filters", () => {
  assert.deepEqual(Array.from(navigation.dashboardSections, (section) => section.label), [
    "Áttekintés", "Rangsorok", "Statisztikák", "Részletek", "Versenyek", "Szezonkiemelések", "Adatminőség",
  ]);
  for (const label of ["Verseny", "Divízió", "Egyesület"]) {
    assert.equal(headerSource.split(`label="${label}"`).length - 1, 2);
  }
  assert.match(dashboardSource, /qualityLabels: Record<keyof DataQuality, string>/);
  assert.doesNotMatch(dashboardSource, /label\.replace|N\/A/);
});

test("Hungarian locale formats numbers, dates, and missing values", () => {
  assert.equal(utils.formatNumber(1234.5, 2), new Intl.NumberFormat("hu-HU", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(1234.5));
  assert.equal(utils.formatDate("2026-05-12"), new Intl.DateTimeFormat("hu-HU", {
    year: "numeric", month: "short", day: "numeric",
  }).format(new Date("2026-05-12")));
  assert.equal(utils.formatNullableNumber(null), "Nincs adat");
  assert.equal(utils.formatNullableNumber(undefined), "Nincs adat");
  assert.equal(utils.formatNullableNumber(NaN), "Nincs adat");
  assert.equal(utils.formatNullableNumber(0), "0");
  assert.equal(utils.formatDate(null), "Nincs adat");
});

test("document language and page metadata use Hungarian", () => {
  const layout = fs.readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const season = fs.readFileSync(new URL("../app/[year]/page.tsx", import.meta.url), "utf8");
  const methodology = fs.readFileSync(new URL("../app/methodology/page.tsx", import.meta.url), "utf8");
  const notFound = fs.readFileSync(new URL("../app/not-found.tsx", import.meta.url), "utf8");
  assert.match(layout, /lang="hu"/);
  assert.match(layout, /Szezonstatisztikák/);
  assert.match(season, /Szezonstatisztikák/);
  assert.match(methodology, /Módszertan \| Hero of IDPA/);
  assert.match(notFound, /Az oldal nem található/);
});

test("navigation destinations and dashboard anchors remain in lockstep", () => {
  const sections = Array.from(navigation.dashboardSections);
  assert.equal(sections[0].id, "overview");
  assert.deepEqual(new Set(sections.map((section) => section.id)), new Set([
    "overview",
    "rankings",
    "analytics",
    "details",
    "competitions",
    "insights",
    "data-quality",
  ]));
  for (const section of sections) {
    assert.ok(section.label.length > 0);
    assert.match(dashboardSource, new RegExp(`id="${section.id}"`));
  }
});

test("every navigation href targets the shared section registry", () => {
  assert.ok(headerSource.includes("href={`#${section.id}`}"));
  assert.ok(headerSource.includes("dashboardSections.map((section) =>"));
  assert.equal(navigation.isDashboardSectionId("rankings"), true);
  assert.equal(navigation.isDashboardSectionId("missing"), false);
});

test("dashboard filters are limited to competition, division, and club", () => {
  for (const id of [
    "competition-filter",
    "division-filter",
    "club-filter",
    "mobile-competition-filter",
    "mobile-division-filter",
    "mobile-club-filter",
  ]) {
    assert.ok(headerSource.includes(`id="${id}"`), `missing filter control ${id}`);
  }
  assert.doesNotMatch(headerSource, /Minimum participation|participation-filter|minimumParticipation/);
  assert.doesNotMatch(dashboardSource, /minimumParticipation/);
});

test("footer organization and discipline records include accessible local logos and official links", () => {
  const organizations = Array.from(associations.governingOrganizations);
  const disciplines = Array.from(associations.mdlszDisciplines);
  assert.deepEqual(organizations.map((entry) => entry.name), ["MDLSZ", "IDPA"]);
  assert.deepEqual(disciplines.map((entry) => entry.name), [
    "IPSC",
    "IMSSU",
    "IDPA",
    "Gyorskombinált",
    "Steel Challenge",
    "Gyorspont és hazai versenyszámok",
    "IPRF",
  ]);
  for (const entry of [...organizations, ...disciplines]) {
    assert.match(entry.href, /^https:\/\/(mdlsz\.com|www\.idpa\.com)\//);
    assert.match(entry.logo, /^\/logos\/.+\.(png|svg)$/);
    assert.ok(entry.alt.length > 0);
    assert.ok(entry.width > 0 && entry.height > 0);
  }
});
