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
function loadModule(source, dependencies = {}) {
  const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const fallbackRequire = createRequire(import.meta.url);
  vm.runInNewContext(compiled, {
  exports,
  process,
  URL,
  require: (name) => dependencies[name] ?? fallbackRequire(name),
  Intl,
  });
  return exports;
}
const navigation = loadModule(navigationSource);
const associations = loadModule(associationsSource);
const disciplines = loadModule(
  fs.readFileSync(new URL("../lib/disciplines.ts", import.meta.url), "utf8"),
  { "@/lib/associations": associations },
);
const paths = loadModule(fs.readFileSync(new URL("../lib/discipline-paths.ts", import.meta.url), "utf8"));
const sourceSummary = loadModule(fs.readFileSync(new URL("../lib/discipline-summary.ts", import.meta.url), "utf8"));
const ipscStatistics = loadModule(fs.readFileSync(new URL("../lib/ipsc-statistics.ts", import.meta.url), "utf8"));
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
  const season = fs.readFileSync(new URL("../app/[discipline]/[year]/page.tsx", import.meta.url), "utf8");
  const methodology = fs.readFileSync(new URL("../app/[discipline]/methodology/page.tsx", import.meta.url), "utf8");
  const notFound = fs.readFileSync(new URL("../app/not-found.tsx", import.meta.url), "utf8");
  assert.match(layout, /lang="hu"/);
  assert.match(layout, /lang="hu"/);
  assert.match(layout, /Lövésznapló Statisztika/);
  assert.match(season, /szezoneredmények/);
  assert.match(methodology, /módszertan/);
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

test("discipline registry exposes seven source-linked sports and publishes validated IDPA and IPSC", () => {
  const records = Array.from(disciplines.disciplineDefinitions);
  assert.equal(records.length, 7);
  assert.deepEqual(records.map(({ slug }) => slug), [
    "ipsc", "imssu", "idpa", "gyorskombinalt", "steel-challenge",
    "gyorspont-es-hazai-versenyszamok", "iprf",
  ]);
  assert.deepEqual(records.filter(({ published }) => published).map(({ slug }) => slug), ["ipsc", "idpa"]);
  assert.equal(disciplines.getDiscipline("ipsc").analytics, "ipsc");
  for (const record of records) {
    assert.ok(disciplines.getDisciplineMark(record.slug));
    assert.ok(record.aliases.length > 0);
    assert.ok(!record.slug.includes(" "));
  }
});

test("discipline landing pages open the newest season and the footer links every discipline", () => {
  const platformPage = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const disciplinePage = fs.readFileSync(new URL("../app/[discipline]/page.tsx", import.meta.url), "utf8");
  const disciplineLayout = fs.readFileSync(new URL("../app/[discipline]/layout.tsx", import.meta.url), "utf8");
  const seasonPage = fs.readFileSync(new URL("../app/[discipline]/[year]/page.tsx", import.meta.url), "utf8");
  const footer = fs.readFileSync(new URL("../components/layout/site-footer.tsx", import.meta.url), "utf8");
  assert.match(disciplinePage, /redirect\(seasonPath\(discipline\.slug, latestYear\)\)/);
  assert.doesNotMatch(disciplinePage, /Elérhető szezonok/);
  assert.match(platformPage, /href=\{disciplinePath\(discipline\.slug\)\}/);
  assert.match(platformPage, /disciplineDefinitions\.map/);
  assert.doesNotMatch(platformPage, /opacity-65|<div aria-label=\{`/);
  assert.match(disciplinePage, /disciplineDefinitions\.map/);
  assert.match(seasonPage, /<IpscDashboard/);
  assert.match(seasonPage, /buildIpscStatistics/);
  assert.match(seasonPage, /discipline:\s*discipline\.slug/);
  assert.match(seasonPage, /year:\s*String\(year\)/);
  assert.match(disciplineLayout, /return children/);
  assert.match(disciplinePage, /robots:\s*\{\s*index:\s*false,\s*follow:\s*true,\s*googleBot:/);
  assert.match(footer, /href=\{disciplinePath\(definition\.slug\)\}/);
});

test("discipline URLs centralize season and canonical paths on the chosen production host", () => {
  assert.equal(paths.seasonPath("idpa", 2026), "/idpa/2026");
  assert.equal(paths.seasonPath("steel-challenge", 2026), "/steel-challenge/2026");
  assert.equal(paths.methodologyPath("idpa"), "/idpa/methodology");
  assert.equal(paths.methodologyPath("ipsc"), "/ipsc/methodology");
  assert.equal(paths.canonicalUrl("/"), "https://statisztika.lovesznaplo.hu");
  assert.equal(paths.canonicalUrl("/idpa/2026"), "https://statisztika.lovesznaplo.hu/idpa/2026");
});

test("descriptive summaries count source rows, names, clubs, and divisions without rankings", () => {
  const summary = sourceSummary.summarizeSourceResults([
    { normalizedCompetitorName: "alex-one", competitorName: "Alex One", normalizedClub: "club-a", club: "Club A", division: "Minor" },
    { normalizedCompetitorName: "alex-one", competitorName: "Alex One", normalizedClub: "club-a", club: "Club A", division: "Minor" },
    { normalizedCompetitorName: "bea-two", competitorName: "Bea Two", normalizedClub: "club-b", club: "Club B", division: "Major" },
    { normalizedCompetitorName: "unknown-three", competitorName: "Unknown Three" },
  ]);
  assert.equal(summary.resultRows, 4);
  assert.equal(summary.distinctNameIdentifiers, 3);
  assert.equal(summary.representedClubs, 2);
  assert.equal(summary.rowsWithoutDivision, 1);
  assert.deepEqual(Array.from(summary.divisionCounts, (entry) => [entry.division, entry.entries]), [
    ["Major", 1],
    ["Minor", 2],
  ]);
  assert.equal("rankings" in summary, false);
  assert.equal("scores" in summary, false);
});

test("IPSC standings compare official placements within each match and division", () => {
  const competitions = [
    { id: "match-a", name: "Match A", date: "2026-03-01", level: "Level 2", sourceUrl: "/a", resultPdfUrl: "/a.pdf" },
    { id: "match-b", name: "Match B", date: "2026-04-01", level: "Level 1", sourceUrl: "/b" },
    { id: "exam", name: "Licence vizsga", date: "2026-05-01", level: "Licenc", sourceUrl: "/exam" },
  ];
  const result = (competitionId, division, name, licenseId, placement, club = "Club A") => ({
    competitionId,
    competitionName: competitionId,
    competitionDate: "2026-03-01",
    competitorName: name,
    normalizedCompetitorName: name.toLowerCase().replaceAll(" ", "-"),
    competitorLicenseId: licenseId,
    division,
    placement,
    club,
    normalizedClub: club,
    resultPercentage: placement === 1 ? "100.0000%" : undefined,
  });
  const statistics = ipscStatistics.buildIpscStatistics(competitions, [
    result("match-a", "Production", "Alex Shooter", "01234", 1),
    result("match-a", "Production", "Bea Shooter", "05678", 2, "Club B"),
    result("match-a", "Production", "Cy Shooter", "09012", 3),
    result("match-a", "Open", "Alex Shooter", "01234", 1),
    result("match-a", "Open", "Dee Shooter", "03456", 2),
    result("match-b", "Production", "A. Shooter", "1234", 2),
    result("match-b", "Production", "Bea Shooter", "05678", 1, "Club B"),
    result("exam", "Production", "Alex Shooter", "01234", 1),
    { ...result("match-b", undefined, "Unmapped Shooter", "07890", 1) },
    { ...result("match-b", "Production", "No Placement", "07891", undefined) },
  ]);

  const production = statistics.leaderboard.filter((entry) => entry.division === "Production");
  assert.deepEqual(Array.from(production, ({ competitorName, averagePercentile, matchCount }) => [
    competitorName, averagePercentile, matchCount,
  ]), [
    ["Bea Shooter", 75, 2],
    ["Alex Shooter", 50, 2],
    ["Cy Shooter", 0, 1],
  ]);
  assert.equal(statistics.levelMatchCount, 2);
  assert.equal(statistics.comparableMatchDivisions, 3);
  assert.equal(statistics.rowsOutsideLevelMatches, 1);
  assert.equal(statistics.resultsWithoutDivision, 1);
  assert.equal(statistics.resultsWithoutPlacement, 1);
  assert.equal(statistics.resultPercentagesAvailable, 5);
  assert.equal(statistics.competitions[2].eligibleRows, 0);
  assert.equal(statistics.leaderboard.some((entry) => entry.division !== "Production" && entry.competitorName === "Alex Shooter"), true);
});

test("IPSC standings merge equivalent official division labels", () => {
  const statistics = ipscStatistics.buildIpscStatistics(
    [{ id: "match", name: "Match", date: "2026-03-01", level: "Level 2", sourceUrl: "/match" }],
    [
      { competitionId: "match", competitionName: "Match", competitionDate: "2026-03-01", competitorName: "A", normalizedCompetitorName: "a", division: "Pisztoly-Production Optic", placement: 1 },
      { competitionId: "match", competitionName: "Match", competitionDate: "2026-03-01", competitorName: "B", normalizedCompetitorName: "b", division: "Production Optics", placement: 2 },
    ],
  );
  assert.deepEqual(Array.from(statistics.divisions, (division) => division.value), ["Production Optics"]);
  assert.equal(statistics.comparableResultRows, 2);
});

test("legacy host and old root year URLs redirect directly to the discipline path", () => {
  const redirects = [];
  const proxy = loadModule(fs.readFileSync(new URL("../proxy.ts", import.meta.url), "utf8"), {
    "next/server": {
      NextResponse: {
        next: () => ({ action: "next" }),
        redirect: (url, status) => {
          const result = { action: "redirect", url: url.toString(), status };
          redirects.push(result);
          return result;
        },
      },
    },
    "@/lib/discipline-paths": { siteOrigin: paths.siteOrigin },
  });
  const request = (hostname, pathname, search = "") => ({
    nextUrl: { hostname, pathname, search },
  });
  assert.deepEqual(
    proxy.proxy(request("hero-of-idpa.hu", "/2026", "?source=old")).url,
    "https://statisztika.lovesznaplo.hu/idpa/2026?source=old",
  );
  assert.equal(redirects.at(-1).status, 308);
  assert.equal(proxy.proxy(request("statisztika.lovesznaplo.hu", "/2025")).url,
    "https://statisztika.lovesznaplo.hu/idpa/2025");
  assert.equal(proxy.proxy(request("hero-of-idpa.hu", "/")).url, "https://statisztika.lovesznaplo.hu/idpa");
  assert.equal(
    proxy.proxy(request("hero-of-idpa.hu", "/methodology")).url,
    "https://statisztika.lovesznaplo.hu/idpa/methodology",
  );
  assert.equal(
    proxy.proxy(request("statisztika.lovesznaplo.hu", "/methodology")).url,
    "https://statisztika.lovesznaplo.hu/idpa/methodology",
  );
  assert.deepEqual(proxy.proxy(request("statisztika.lovesznaplo.hu", "/")), { action: "next" });
  assert.deepEqual(proxy.proxy(request("hero-of-idpa.hu", "/unknown")), { action: "next" });
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
