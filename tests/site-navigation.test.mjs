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
const competitorIdentity = loadModule(fs.readFileSync(new URL("../lib/competitor-identity.ts", import.meta.url), "utf8"));
const steelChallengeStatistics = loadModule(
  fs.readFileSync(new URL("../lib/steel-challenge-statistics.ts", import.meta.url), "utf8"),
  { "@/lib/competitor-identity": competitorIdentity },
);
const gyorskombinaltStatistics = loadModule(
  fs.readFileSync(new URL("../lib/gyorskombinalt-statistics.ts", import.meta.url), "utf8"),
  { "@/lib/competitor-identity": competitorIdentity },
);
const imssuStatistics = loadModule(
  fs.readFileSync(new URL("../lib/imssu-statistics.ts", import.meta.url), "utf8"),
  { "@/lib/competitor-identity": competitorIdentity },
);
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

test("discipline registry exposes seven source-linked sports and five custom public dashboards", () => {
  const records = Array.from(disciplines.disciplineDefinitions);
  assert.equal(records.length, 7);
  assert.deepEqual(records.map(({ slug }) => slug), [
    "ipsc", "imssu", "idpa", "gyorskombinalt", "steel-challenge",
    "gyorspont-es-hazai-versenyszamok", "iprf",
  ]);
  assert.deepEqual(records.filter(({ published }) => published).map(({ slug }) => slug), ["ipsc", "imssu", "idpa", "gyorskombinalt", "steel-challenge"]);
  assert.equal(disciplines.getDiscipline("imssu").analytics, "imssu");
  assert.equal(disciplines.getDiscipline("ipsc").analytics, "ipsc");
  assert.equal(disciplines.getDiscipline("gyorskombinalt").analytics, "gyorskombinalt");
  assert.equal(disciplines.getDiscipline("steel-challenge").analytics, "steel-challenge");
  for (const record of records) {
    assert.ok(disciplines.getDisciplineMark(record.slug));
    assert.ok(record.aliases.length > 0);
    assert.ok(!record.slug.includes(" "));
  }
});

test("Gyorskombinalt identifies licenses without bridging names or guessing missing identifiers", () => {
  const identify = gyorskombinaltStatistics.gyorskombinaltIdentity;
  const row = { competitorName: "Teszt Elek", normalizedCompetitorName: "teszt-elek" };
  assert.equal(identify({ ...row, rawRow: { "V.eng.": "00123" } }), "license:123");
  assert.equal(identify({ ...row, competitorLicenseId: "123" }), "license:123");
  assert.equal(identify({ ...row, rawRow: { "V.eng.": "000" } }), "name:teszt-elek");
  assert.equal(identify({ ...row, rawRow: { "V.eng.": "nem közölt" } }), "name:teszt-elek");
  assert.notEqual(identify(row), identify({ ...row, competitorLicenseId: "123" }));
});

test("Gyorskombinalt counts source rows separately from people and competitions without scoring", () => {
  const competitions = [
    { id: "a", date: "2026-02-06 - 02-07" },
    { id: "b", date: "2026-02-20" },
    { id: "c", date: "ismeretlen" },
  ];
  const base = { competitorName: "Teszt Elek", normalizedCompetitorName: "teszt-elek", club: "Klub", competitorLicenseId: "123" };
  const results = [
    { ...base, competitionId: "a", division: "Manual", placement: 99, rawResult: "55", rawNotes: "166.46" },
    { ...base, competitionId: "a", division: "Manual", placement: 1 },
    { ...base, competitionId: "b", division: "manual" },
    { ...base, competitionId: "missing", division: "Manual" },
    { competitorName: "Másik Elek", normalizedCompetitorName: "masik-elek", competitionId: "a" },
  ];
  const summary = gyorskombinaltStatistics.buildGyorskombinaltStatistics(competitions, results);
  assert.equal(summary.unlinkedRows, 1);
  assert.equal(summary.linkedResults.length, 4);
  assert.equal(summary.people[0].rows, 3);
  assert.equal(summary.people[0].matches, 2);
  assert.equal(summary.competitions[0].rows, 3);
  assert.equal(summary.competitions[0].people, 2);
  assert.equal(summary.divisions.find(({ name }) => name === "Manual").people, 1);
  assert.equal(summary.divisions.length, 3);
  assert.equal(summary.clubs[0].rows, 3);
  assert.equal(summary.clubs[0].people, 1);
  assert.equal(summary.months[0].count, 2);
  assert.equal(summary.undatedCompetitions, 1);
  assert.equal("score" in summary.people[0], false);
  assert.equal("averagePlacement" in summary.people[0], false);
  assert.equal("timeSeconds" in summary.people[0], false);
  assert.equal(summary.linkedResults[0].rawNotes, "166.46");
});

test("Gyorskombinalt empty seasons and custom navigation do not invent rankings", () => {
  const empty = gyorskombinaltStatistics.buildGyorskombinaltStatistics([], []);
  assert.equal(empty.people.length, 0);
  assert.equal(empty.divisions.length, 0);
  assert.equal(empty.unlinkedRows, 0);
  const dashboard = fs.readFileSync(new URL("../components/dashboard/gyorskombinalt-dashboard.tsx", import.meta.url), "utf8");
  const season = fs.readFileSync(new URL("../app/[discipline]/[year]/page.tsx", import.meta.url), "utf8");
  for (const { id } of navigation.dashboardSections) assert.match(dashboard, new RegExp(`id="${id}"`));
  assert.match(dashboard, /rankings: "Részvétel"/);
  assert.match(dashboard, /Forrássorszám/);
  assert.match(dashboard, /számított szezonrangsor nélkül/);
  assert.match(season, /<GyorskombinaltDashboard/);
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
  assert.match(seasonPage, /<SteelChallengeDashboard/);
  assert.match(seasonPage, /buildIpscStatistics/);
  assert.match(seasonPage, /buildSteelChallengeStatistics/);
  assert.match(seasonPage, /discipline:\s*discipline\.slug/);
  assert.match(seasonPage, /year:\s*String\(year\)/);
  assert.match(disciplineLayout, /return children/);
  assert.match(disciplinePage, /robots:\s*\{\s*index:\s*false,\s*follow:\s*true,\s*googleBot:/);
  assert.match(footer, /href=\{disciplinePath\(definition\.slug\)\}/);
});

test("Steel Challenge standings rank by within-field placement percentiles", () => {
  const competitions = [
    { id: "sc-1", name: "Steel 1", date: "2026-03-01", level: "Minősítő verseny", sourceUrl: "/sc-1", resultPdfUrl: "/sc-1.pdf" },
    { id: "sc-2", name: "Steel 2", date: "2026-04-01", level: "Minősítő verseny", sourceUrl: "/sc-2" },
  ];
  const row = (competitionId, division, name, licenseId, placement, rawResult, club = "Club A") => ({
    competitionId,
    competitionName: competitionId,
    competitionDate: "2026-03-01",
    competitorName: name,
    normalizedCompetitorName: name.toLowerCase().replaceAll(" ", "-"),
    competitorLicenseId: licenseId,
    division,
    placement,
    rawResult,
    club,
    normalizedClub: club,
  });
  const statistics = steelChallengeStatistics.buildSteelChallengeStatistics(competitions, [
    row("sc-1", "Open", "Alex Shooter", "000123", 1, "100"),
    row("sc-1", "Open", "Bea Shooter", "000124", 2, "95", "Club B"),
    row("sc-1", "Open", "Cy Shooter", "000125", 3, "80"),
    row("sc-2", "Open", "Alex Shooter", "123", 2, "95"),
    row("sc-2", "Open", "Bea Shooter", "124", 1, "100", "Club B"),
    row("sc-2", "Open", "Cy Shooter", "125", 3, "65"),
  ]);

  const leaderboard = statistics.leaderboard.filter((entry) => entry.division === "Open");
  assert.deepEqual(Array.from(leaderboard, ({ competitorName, averagePercentile, matchCount }) => [
    competitorName, averagePercentile, matchCount,
  ]), [
    ["Alex Shooter", 75, 2],
    ["Bea Shooter", 75, 2],
    ["Cy Shooter", 0, 2],
  ]);
  assert.equal(leaderboard[0].averagePlacement, 1.5);
  assert.equal(leaderboard[1].averagePlacement, 1.5);
  assert.equal(statistics.rankedFields, 2);
  assert.equal(statistics.rankedRows, 6);
  assert.equal(statistics.excludedRows.length, 0);
  assert.equal(statistics.resultsWithRawValue, 6);
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

function imssuRow(overrides) {
  return {
    competitionId: "m1",
    competitionName: "Teszt verseny",
    competitionDate: "2026-05-01",
    competitorName: "Teszt Elek",
    normalizedCompetitorName: "teszt-elek",
    division: "KKPU - Optika",
    club: "Klub",
    rawRow: {},
    ...overrides,
  };
}

test("IMSSU compares hits only within a competition and division, sharing tied positions", () => {
  const competitions = [
    { id: "m1", name: "Első", date: "2026-05-01", level: "Minősítő verseny", sourceUrl: "https://example.test/1" },
    { id: "m2", name: "OB", date: "2026-08-28 - 08-30", level: "Országos Bajnokság", sourceUrl: "https://example.test/2" },
  ];
  const person = (name, license, hits, placement, extra = {}) => imssuRow({
    competitorName: name, normalizedCompetitorName: name.toLowerCase(), rawRow: { "V.eng.": license },
    rawResult: String(hits), placement, ...extra,
  });
  const results = [
    person("A", "0001", 30, 1),
    person("B", "0002", 20, 2),
    person("C", "0003", 20, 3),
    person("D", "0004", 10, 4),
    // A different event with far fewer targets: raw hits are never compared across competitions.
    person("D", "4", 9, 1, { competitionId: "m2" }),
    person("A", "1", 4, 2, { competitionId: "m2" }),
  ];
  const stats = imssuStatistics.buildImssuStatistics(competitions, results);
  const field = Object.fromEntries(stats.fieldResults.filter((r) => r.competitionId === "m1").map((r) => [r.competitorName, r]));
  assert.equal(field.A.percentile, 100);
  assert.equal(field.B.hitPosition, 2.5);
  assert.equal(field.B.percentile, field.C.percentile);
  assert.equal(field.B.percentile, 50);
  assert.equal(field.D.percentile, 0);
  assert.equal(field.B.winnerShare, (100 * 20) / 30);
  const leaders = stats.leaderboard.filter((entry) => entry.division === "KKPU - Optika");
  assert.equal(leaders.find((entry) => entry.competitorName === "D").averagePercentile, 50);
  assert.equal(leaders.find((entry) => entry.competitorName === "A").averagePercentile, 50);
  assert.equal(leaders[0].competitorName, "A", "equal percentile and match count break on the higher winner share");
  assert.equal(leaders.find((entry) => entry.competitorName === "D").wins, 1);
  assert.deepEqual(Array.from(stats.championshipWinners, (winner) => winner.competitorName), ["D"]);
  assert.equal(stats.rankedFields, 2);
});

test("IMSSU merges the documented international air-rifle labels and deduplicates repeated tables", () => {
  assert.equal(imssuStatistics.canonicalImssuDivision("Légpuska - Nemzetközi"), "Légpuska Nemzetközi (41m)");
  assert.equal(imssuStatistics.canonicalImssuDivision("Légpuska NK (41m)"), "Légpuska Nemzetközi (41m)");
  assert.equal(imssuStatistics.canonicalImssuDivision("Légpuska (25m)"), "Légpuska (25m)");
  assert.equal(imssuStatistics.canonicalImssuDivision("Légpisztoly NK (18m)"), "Légpisztoly NK (18m)");
  const competitions = [{ id: "m1", name: "OB", date: "2026-08-28", level: "Országos Bajnokság", sourceUrl: "https://example.test" }];
  const rows = [
    imssuRow({ division: "Légpuska - Nemzetközi", rawResult: "34", placement: 1, rawRow: { "V.eng.": "04309" }, competitorName: "V" }),
    imssuRow({ division: "Légpuska NK (41m)", rawResult: "34", placement: 1, rawRow: { "V.eng.": "04309" }, competitorName: "V" }),
    imssuRow({ division: "Légpuska NK (41m)", rawResult: "33", placement: 2, rawRow: { "V.eng.": "01082" }, competitorName: "G" }),
  ];
  const stats = imssuStatistics.buildImssuStatistics(competitions, rows);
  assert.equal(stats.duplicateIdentityRows, 1);
  assert.equal(stats.rankedRows, 2);
  assert.deepEqual(Array.from(stats.divisions[0].sourceLabels), ["Légpuska - Nemzetközi", "Légpuska NK (41m)"]);
});

test("IMSSU surfaces non-result rows, column shifts, and singleton fields instead of ranking them", () => {
  const competitions = [{ id: "m1", name: "Teszt", date: "2026-03-22", level: "", sourceUrl: "https://example.test" }];
  const stats = imssuStatistics.buildImssuStatistics(competitions, [
    imssuRow({ division: null, competitorName: "- célja:" }),
    imssuRow({ rawResult: "", rawNotes: "27", competitorName: "Eltolt" }),
    imssuRow({ rawResult: "kizárva", competitorName: "Hiányos" }),
    imssuRow({ competitionId: "ismeretlen", rawResult: "10" }),
    imssuRow({ division: "KKPI revolver", rawResult: "12", competitorName: "Egyedül" }),
  ]);
  assert.deepEqual(Array.from(stats.excludedRows, (row) => row.reason).sort(), [
    "missing-division", "missing-hits", "possible-column-shift", "unknown-competition",
  ]);
  assert.equal(stats.excludedRows.find((row) => row.reason === "possible-column-shift").detail, "27");
  assert.equal(stats.singletonFields, 1);
  assert.equal(stats.rankedRows, 0);
  assert.equal(stats.leaderboard.length, 0);
  assert.equal(imssuStatistics.imssuAgeNote("super senior"), "Super Senior");
  assert.equal(imssuStatistics.imssuAgeNote("Supersenior"), "Super Senior");
  assert.equal(imssuStatistics.imssuAgeNote("junior, országos csúcs"), "Junior");
  assert.equal(imssuStatistics.imssuAgeNote("5* kos"), undefined);
  const season = fs.readFileSync(new URL("../app/[discipline]/[year]/page.tsx", import.meta.url), "utf8");
  const dashboard = fs.readFileSync(new URL("../components/dashboard/imssu-dashboard.tsx", import.meta.url), "utf8");
  assert.match(season, /<ImssuDashboard/);
  for (const { id } of navigation.dashboardSections) assert.match(dashboard, new RegExp(`id="${id}"`));
});
