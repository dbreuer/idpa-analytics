import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";
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
  vm.runInNewContext(compiled, { exports });
  return exports;
}
const navigation = loadModule(navigationSource);
const associations = loadModule(associationsSource);

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
