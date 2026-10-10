import argparse
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

import common


def script_module(name):
    spec = importlib.util.spec_from_file_location(name.replace("-", "_"), SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class YearPipelineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        data_patch = patch.object(common, "DATA_DIR", self.root)
        data_patch.start()
        self.addCleanup(data_patch.stop)
        environment_patch = patch.dict(os.environ, {"MDLSZ_CALENDAR_URL": "https://portal.mdlsz.com/racecalendar?year=1999&test=1"})
        environment_patch.start()
        self.addCleanup(environment_patch.stop)

    def test_paths_and_calendar_are_season_specific(self):
        first = common.pipeline_paths(2025)
        second = common.pipeline_paths(2026)
        self.assertNotEqual(first.pdf_dir, second.pdf_dir)
        self.assertEqual(first.competitions, self.root / "idpa" / "2025" / "competitions.json")
        self.assertEqual(first.calendar_url, "https://portal.mdlsz.com/racecalendar?test=1&year=2025")
        self.assertEqual(second.calendar_url, "https://portal.mdlsz.com/racecalendar?test=1&year=2026")

    def test_ingestion_paths_cover_every_registered_discipline(self):
        for value in common.DISCIPLINE_ALIASES:
            with self.subTest(discipline=value):
                paths = common.pipeline_paths(2026, value)
                self.assertEqual(paths.discipline, value)
                self.assertEqual(paths.data_dir, self.root / value / "2026")
        self.assertEqual(common.ANALYTICS_DISCIPLINES, frozenset({"idpa"}))
        with self.assertRaisesRegex(ValueError, "Unknown discipline"):
            common.pipeline_paths(2026, "../idpa")

    def test_competition_discovery_recognizes_all_official_discipline_aliases(self):
        discover = script_module("discover-competitions")
        for discipline, aliases in common.DISCIPLINE_ALIASES.items():
            with self.subTest(discipline=discipline):
                paths = common.pipeline_paths(2026, discipline)
                official_label = aliases[-1] if discipline == "gyorskombinalt" else aliases[0]
                row = (
                    "<table><tr><td>2026-05-12</td><td>Sample match</td>"
                    f"<td>{official_label}</td><td>Level</td><td>Budapest</td>"
                    f"<td>Sample club</td><td>{discipline}-2026</td>"
                    '<td><a href="/result.pdf">Eredmények</a></td></tr></table>'
                )
                with patch.object(sys, "argv", ["discover", "--discipline", discipline, "--year", "2026"]):
                    with patch.object(discover, "fetch", return_value=Mock(text=row)):
                        discover.main()
                file = common.load_json(paths.competitions)
                self.assertEqual(len(file["competitions"]), 1)
                self.assertEqual(file["competitions"][0]["discipline"], official_label)

    def test_typescript_and_python_discipline_registries_stay_in_sync(self):
        source = (common.REPO_ROOT / "lib" / "disciplines.ts").read_text(encoding="utf-8")
        declared_slugs = re.findall(r'slug:\s*"([^"]+)"', source)
        self.assertEqual(set(declared_slugs), set(common.DISCIPLINE_ALIASES))
        self.assertEqual(len(declared_slugs), len(common.DISCIPLINE_ALIASES))
        for slug, aliases in common.DISCIPLINE_ALIASES.items():
            entry = re.search(
                rf'slug:\s*"{re.escape(slug)}",(.*?)(?=\n  \{{|\n\] as const)',
                source,
                re.DOTALL,
            )
            self.assertIsNotNone(entry, f"TypeScript registry is missing {slug}")
            declared_aliases = re.findall(r'"([^"]+)"', re.search(r"aliases:\s*\[(.*?)\]", entry.group(1), re.DOTALL).group(1))
            self.assertEqual(declared_aliases, list(aliases), slug)

    def test_pipeline_rejects_mixed_discipline_and_year_inputs(self):
        paths = common.pipeline_paths(2025, "idpa")
        for payload in (
            {"discipline": "ipsc", "year": 2025},
            {"discipline": "idpa", "year": 2026},
            {"year": 2025},
        ):
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                common.validate_payload_scope(payload, paths, "fixture.json")

    def test_invalid_years_are_rejected(self):
        for value in ("25", "2025/../2026", "0", "10000", "2025.5"):
            with self.subTest(value=value), self.assertRaises(argparse.ArgumentTypeError):
                common.parse_year(value)

    def test_pymupdf_fallback_reads_pdf_content(self):
        import pymupdf

        extract = script_module("extract-pdfs")
        pdf_path = self.root / "fallback.pdf"
        with pymupdf.open() as document:
            page = document.new_page()
            page.insert_text(
                (72, 72),
                "Sorszam | Nev | Egyesulet | Eredmeny\n1 | Test Competitor | Test Club | 100",
            )
            document.save(pdf_path)

        tables = extract.extract_with_pymupdf(pdf_path)
        self.assertEqual(len(tables), 1)
        self.assertEqual(tables[0]["strategy"], "pymupdf-text")
        self.assertEqual(tables[0]["headerMap"]["name"], 1)
        self.assertEqual(tables[0]["rows"], [["1", "Test Competitor", "Test Club", "100"]])

    def test_ipsc_license_ids_are_numeric_and_keep_valid_zero_padding(self):
        normalize = script_module("normalize-data")
        self.assertEqual(normalize.normalize_license_id(" 01234 "), "01234")
        self.assertIsNone(normalize.normalize_license_id("00000"))
        self.assertIsNone(normalize.normalize_license_id("A001"))

    def test_single_club_column_keeps_hyphenated_and_slashed_club_names_whole(self):
        normalize = script_module("normalize-data")
        self.assertFalse(normalize.is_combined_club_team_header("Egyesület"))
        self.assertTrue(normalize.is_combined_club_team_header("Egyesület / Csapat"))
        self.assertTrue(normalize.is_combined_club_team_header("Club / Team"))
        for value in ("48-as SE.", "T-BODY Fitness\nSportegyesület", "Városi Lövészklub\nTatabánya (51173/2002)", "Police Academy Sport Club\n- PASC"):
            club, team = normalize.split_club_team(value, combined_header=False)
            self.assertEqual(club, common.normalize_text(value))
            self.assertIsNone(team)
        self.assertEqual(normalize.split_club_team("Club / Team A", combined_header=True), ("Club", "Team A"))
        self.assertEqual(normalize.split_club_team("  ", combined_header=False), (None, None))

    def test_club_variants_group_without_rewriting_published_spellings(self):
        normalize = script_module("normalize-data")
        key = common.club_match_key
        self.assertEqual(key("Pandúr Lövész-\nKlub\nSportegyesület"), key("Pandúr Lövész-Klub Sportegyesület"))
        self.assertEqual(key("MTTSZ Lövész-\nÍjász\nSportegyesület"), key("MTTSZ Lövész- Íjász Sportegyesület"))
        self.assertEqual(key("Villanás Lövész-\nVitorlás- és Motorsport"), key("Villanás Lövész- Vitorlás-\nés Motorsport"))
        self.assertNotEqual(key("Püspökladányi Lövész- és Tömegsportklub"), key("Püspökladányi Lövész-és Tömegsportklub"))
        self.assertNotEqual(key("Diána Sportlövész Klub - Paks"), key("Diána Sportlövész Klub"))
        results = [
            {"club": "Pandúr Lövész-Klub Sportegyesület"},
            {"club": "Pandúr Lövész- Klub Sportegyesület"},
            {"club": "Pandúr Lövész-Klub Sportegyesület"},
            {"club": "Globus SE"},
            {"club": None},
        ]
        normalize.unify_club_spellings(results, {"Globus SE": "Globus Sportegyesület"})
        self.assertEqual({r["normalizedClub"] for r in results[:3]}, {"Pandúr Lövész-Klub Sportegyesület"})
        self.assertEqual(results[1]["club"], "Pandúr Lövész- Klub Sportegyesület")
        self.assertEqual(results[3]["normalizedClub"], "Globus Sportegyesület")
        self.assertNotIn("normalizedClub", results[4])

    def test_ipsc_pdf_adapter_tracks_division_headings_across_continuation_pages(self):
        extract = script_module("extract-pdfs")

        class Page:
            def __init__(self, text, tables):
                self._text = text
                self._tables = tables

            def extract_text(self):
                return self._text

            def extract_tables(self):
                return self._tables

        pages = [
            Page("Match Results - Classic\nMatch Results - Open", [
                [["1", "Competitor A", "A001", "", "C", "Min", "Senior", "500.00", "100.00%"]],
                [["1", "Competitor B", "B001", "", "O", "Maj", "", "490.00", "98.00%"]],
            ]),
            Page("Match Results - Production Optics", [
                [["2", "Competitor B", "B001", "", "O", "Maj", "", "480.00", "96.00%"]],
                [["1", "Competitor C", "C001", "", "PO", "Min", "Lady", "470.00", "94.00%"]],
            ]),
            Page("", [
                [["2", "Competitor C", "C001", "", "PO", "Min", "Lady", "460.00", "92.00%"]],
            ]),
        ]
        pdf = Mock()
        pdf.__enter__ = Mock(return_value=Mock(pages=pages))
        pdf.__exit__ = Mock(return_value=False)
        with patch.object(extract.pdfplumber, "open", return_value=pdf):
            tables, errors = extract.extract_ipsc_with_pdfplumber(self.root / "ipsc.pdf")

        self.assertEqual(errors, [])
        self.assertEqual([table["metadata"]["division"] for table in tables], [
            "Classic", "Open", "Open", "Production Optics", "Production Optics",
        ])
        self.assertEqual(tables[0]["headerMap"]["classification"], 4)
        self.assertEqual(tables[0]["headerMap"]["powerFactor"], 5)
        self.assertEqual(tables[0]["headerMap"]["result"], 7)
        self.assertEqual(tables[0]["headerMap"]["license"], 2)

    def test_ipsc_extractor_parses_hungarian_metadata_tables_and_continuation_pages(self):
        extract = script_module("extract-pdfs")
        header = ["Sorszám", "Név", "V.eng.", "Egyesület", "Eredmény", "Találatok száma", "%", "Megjegyzés"]

        class Page:
            def __init__(self, text, tables):
                self._text = text
                self._tables = tables

            def extract_text(self):
                return self._text

            def extract_tables(self):
                return self._tables

        pages = [
            Page("Globus match", [[
                ["Szervező:", "Club", "Szakág:", "IPSC"],
                ["Helyszín:", "Budapest", "Verseny típus:", "Pisztoly"],
                ["Dátum:", "2026-03-15", "Divízió:", "Production"],
                header,
                ["1", "Athlete One", "01234", "Club A", "100.0000", "", "", ""],
            ]]),
            Page("Continued", [[
                ["2", "Athlete Two", "05678", "Club B", "92.5000", "", "", ""],
            ]]),
            Page("New division", [[
                ["Dátum:", "2026-03-15", "Divízió:", "Standard"],
                header,
                ["1", "Athlete Three", "07890", "Club C", "100.0000", "", "", ""],
            ]]),
        ]
        pdf = Mock()
        pdf.__enter__ = Mock(return_value=Mock(pages=pages))
        pdf.__exit__ = Mock(return_value=False)
        with patch.object(extract.pdfplumber, "open", return_value=pdf):
            tables, errors = extract.extract_ipsc_with_pdfplumber(self.root / "ipsc-mdlsz.pdf")

        self.assertEqual(errors, [])
        self.assertEqual([table["metadata"]["division"] for table in tables], [
            "Production", "Production", "Standard",
        ])
        self.assertEqual(tables[0]["strategy"], "ipsc-mdlsz-table")
        self.assertEqual(tables[0]["rows"][0][1], "Athlete One")
        self.assertEqual(tables[1]["rows"][0][1], "Athlete Two")
        self.assertEqual(tables[0]["headerMap"]["license"], 2)
        self.assertEqual(tables[0]["headerMap"]["percentage"], 6)

    def test_normalization_ingests_all_disciplines_without_inventing_idpa_metrics(self):
        normalize = script_module("normalize-data")
        validate = script_module("validate-ingestion")
        extract = script_module("extract-pdfs")
        standard_header = ["Sorszám", "Név", "V.eng.", "Egyesület", "Eredmény", "Találatok száma", "%", "Megjegyzés"]
        for discipline, aliases in common.DISCIPLINE_ALIASES.items():
            if discipline == "idpa":
                continue
            with self.subTest(discipline=discipline):
                paths = common.pipeline_paths(2026, discipline)
                common.ensure_dirs(paths)
                official_name = aliases[0]
                competition = {
                    "id": f"{discipline}-race-2026",
                    "name": "Sample discipline event",
                    "date": "2026-05-12",
                    "discipline": official_name,
                    "level": "Level 2",
                    "resultPdfUrl": f"https://example.invalid/{discipline}.pdf",
                    "downloadStatus": "downloaded",
                }
                common.save_json(paths.competitions, {
                    "discipline": discipline, "year": 2026, "schemaVersion": 1,
                    "generatedAt": common.now_iso(), "sourceUrl": paths.calendar_url,
                    "discoveredCount": 1, "competitions": [competition], "errors": [],
                })
                if discipline == "ipsc":
                    raw_table = {
                        "header": extract.IPSC_HEADER,
                        "headerMap": extract.IPSC_HEADER_MAP,
                        "metadata": {"division": "Production"},
                        "rows": [["1", "Competitor, Alex", "00123", "", "B", "Minor", "Senior", "500.00", "100.00%"]],
                    }
                else:
                    raw_table = {
                        "header": standard_header,
                        "headerMap": common.identify_header(standard_header),
                        "metadata": {"division": "Division One"},
                        "rows": [["1", "Alex Competitor", "A001", "Sample Club", "125", "12", "100", "unclassified note"]],
                    }
                common.save_json(paths.raw_extracted, {
                    "discipline": discipline, "year": 2026, "schemaVersion": 1,
                    "generatedAt": common.now_iso(),
                    "extractions": [{
                        "competitionId": competition["id"],
                        "status": "processed",
                        "tables": [raw_table],
                        "error": None,
                    }],
                    "errors": [],
                })
                with patch.object(sys, "argv", ["normalize", "--discipline", discipline, "--year", "2026"]):
                    with patch.object(normalize, "CLUB_ALIASES_PATH", self.root / "club-aliases.json"):
                        normalize.main()

                result = common.load_json(paths.results)["results"][0]
                self.assertEqual(result["division"], "Production" if discipline == "ipsc" else "Division One")
                self.assertNotIn("timeSeconds", result)
                self.assertNotIn("parseError", result)
                if discipline == "ipsc":
                    self.assertEqual(result["classification"], "B")
                    self.assertEqual(result["powerFactor"], "Minor")
                    self.assertEqual(result["category"], "Senior")
                    self.assertEqual(result["rawResult"], "500.00")
                    self.assertEqual(result["competitorLicenseId"], "00123")
                    self.assertIsNone(result["club"])
                else:
                    self.assertEqual(result["club"], "Sample Club")
                validate.validate_ingestion(paths.data_dir, discipline, 2026)
                self.assertFalse(paths.statistics.exists())

    def test_gyorskombinalt_calendar_alias_maps_to_its_registered_discipline(self):
        discover = script_module("discover-competitions")
        slug = "gyorskombinalt"
        paths = common.pipeline_paths(2026, slug)
        rows = (
            '<table><tr><td>2026-02-06</td><td>Competition</td>'
            "<td>Gyorskombinált és Precíziós</td><td>Level</td><td>Budapest</td>"
            '<td>Club</td><td>2026/175</td><td><a href="/results.pdf">Eredmények</a></td></tr></table>'
        )
        with patch.object(sys, "argv", ["discover", "--discipline", slug, "--year", "2026"]):
            with patch.object(discover, "fetch", return_value=Mock(text=rows)):
                discover.main()
        competition = common.load_json(paths.competitions)["competitions"][0]
        self.assertEqual(competition["discipline"], "Gyorskombinált és Precíziós")


    def test_missing_previous_stage_fails_without_empty_outputs(self):
        for name in ("download-results", "extract-pdfs", "normalize-data", "calculate-statistics"):
            module = script_module(name)
            with self.subTest(stage=name), patch.object(sys, "argv", [name, "--year", "2025"]):
                with self.assertRaisesRegex(FileNotFoundError, "previous stage"):
                    module.main()
        self.assertEqual(list((self.root / "idpa" / "2025").glob("*.json")), [])

    def test_two_seasons_run_without_overwriting_or_mixing_data(self):
        discover = script_module("discover-competitions")
        download = script_module("download-results")
        extract = script_module("extract-pdfs")
        normalize = script_module("normalize-data")
        statistics = script_module("calculate-statistics")
        validate = script_module("validate-season")
        aliases = self.root / "club-aliases.json"
        common.save_json(aliases, {"Club": "Shared Club"})
        rows = "".join(
            f'<tr><td>{year}.05.01</td><td><a href="/race/{year}.pdf">Season {year}</a></td>'
            f"<td>IDPA</td><td>Level 1</td><td>Budapest</td><td>Club</td><td>race-{year}</td></tr>"
            for year in (2025, 2026)
        )
        response = Mock(text=f"<table>{rows}</table>")
        pdf_response = Mock(content=b"mock PDF")
        tables = [{
            "header": ["Sorszám", "Név", "Egyesület", "Eredmény", "Megjegyzés"],
            "headerMap": {"placement": 0, "name": 1, "club_team": 2, "result": 3, "notes": 4},
            "metadata": {"division": "SSP - Service pistol"},
            "rows": [["1", "Competitor", "Club", "100", "71,33"]],
        }]
        original_2025 = None
        for year in (2025, 2026):
            paths = common.pipeline_paths(year)
            with patch.object(sys, "argv", ["pipeline", "--year", str(year)]):
                with patch.object(discover, "fetch", return_value=response):
                    discover.main()
                with patch.object(download, "fetch", return_value=pdf_response):
                    download.main()
                def extract_tables(pdf_path):
                    self.assertEqual(pdf_path.parent, paths.pdf_dir)
                    self.assertEqual(pdf_path.read_bytes(), b"mock PDF")
                    return tables
                with patch.object(extract, "extract_with_pdfplumber", side_effect=extract_tables):
                    extract.main()
                with patch.object(normalize, "CLUB_ALIASES_PATH", aliases):
                    normalize.main()
                statistics.main()
            for file in (paths.competitions, paths.raw_extracted, paths.results, paths.quality, paths.statistics):
                payload = json.loads(file.read_text())
                self.assertEqual(payload["year"], year)
                self.assertEqual(payload["discipline"], "idpa")
            discovery = common.load_json(paths.competitions)
            self.assertEqual(len(discovery["competitions"]), 1)
            self.assertEqual(discovery["competitions"][0]["id"], f"race-{year}")
            self.assertEqual(discovery["competitions"][0]["resultPdfPath"], f"pdfs/race-{year}.pdf")
            result = common.load_json(paths.results)["results"][0]
            self.assertTrue(result["competitionDate"].startswith(str(year)))
            self.assertEqual(result["normalizedClub"], "Shared Club")
            self.assertEqual(common.load_json(paths.statistics)["statistics"]["totalCompetitions"], 1)
            validate.validate_season(paths.data_dir, "idpa", year)
            if year == 2025:
                original_2025 = {file.name: file.read_bytes() for file in paths.data_dir.glob("*.json")}
        self.assertEqual(
            original_2025,
            {file.name: file.read_bytes() for file in (self.root / "idpa" / "2025").glob("*.json")},
        )
        self.assertFalse((self.root / "competitions.json").exists())

        results_payload = common.load_json(paths.results)
        results_payload["results"] = []
        common.save_json(paths.results, results_payload)
        with self.assertRaisesRegex(ValueError, "No competitor results"):
            validate.validate_season(paths.data_dir, "idpa", 2026)

    def test_discovery_failure_is_recorded_and_stops_runner(self):
        discover = script_module("discover-competitions")
        with patch.object(sys, "argv", ["discover", "--year", "2025"]):
            with patch.object(discover, "fetch", side_effect=RuntimeError("network failed")):
                with self.assertRaisesRegex(SystemExit, "network failed"):
                    discover.main()
        self.assertIn("network failed", common.load_json(common.pipeline_paths(2025).competitions)["errors"][0])

    def test_runner_forwards_year_and_stops_on_failure(self):
        runner = script_module("run-pipeline")
        with patch.object(sys, "argv", ["pipeline", "--discipline", "idpa", "--year", "2025"]):
            with patch.object(runner.subprocess, "run") as run:
                runner.main()
                self.assertEqual(run.call_count, 5)
                for call in run.call_args_list:
                    self.assertEqual(call.args[0][0], sys.executable)
                    self.assertEqual(call.args[0][-2:], ["--year", "2025"])
                    self.assertEqual(call.args[0][2:4], ["--discipline", "idpa"])
                    self.assertTrue(call.kwargs["check"])
            with patch.object(runner.subprocess, "run", side_effect=subprocess.CalledProcessError(1, "discovery")) as run:
                with self.assertRaises(subprocess.CalledProcessError):
                    runner.main()
                self.assertEqual(run.call_count, 1)

    def test_runner_ingests_non_idpa_results_without_running_scoring(self):
        runner = script_module("run-pipeline")
        with patch.object(sys, "argv", ["pipeline", "--discipline", "ipsc", "--year", "2026"]):
            with patch.object(runner.subprocess, "run") as run:
                runner.main()
        scripts = [Path(call.args[0][1]).name for call in run.call_args_list]
        self.assertEqual(scripts, [
            "discover-competitions.py",
            "download-results.py",
            "extract-pdfs.py",
            "normalize-data.py",
            "validate-ingestion.py",
        ])
        self.assertNotIn("calculate-statistics.py", scripts)

    def test_non_idpa_scoring_is_rejected_before_reading_or_writing_data(self):
        statistics = script_module("calculate-statistics")
        with patch.object(sys, "argv", ["stats", "--discipline", "steel-challenge", "--year", "2026"]):
            with self.assertRaisesRegex(SystemExit, "No validated analytics/scoring adapter"):
                statistics.main()
        self.assertEqual(list(self.root.rglob("statistics.json")), [])

    def test_data_migration_is_idempotent_scoped_and_preserves_root_legacy(self):
        migration = script_module("migrate-discipline-data")
        data_dir = self.root / "data"
        legacy = data_dir / "2026"
        legacy.mkdir(parents=True)
        payloads = {
            "competitions.json": {"year": 2026, "competitions": [{"date": "2026.05.01"}]},
            "raw-extracted-results.json": {"year": 2026, "extractions": []},
            "results.json": {"year": 2026, "results": [{"competitionDate": "2026.05.01"}]},
            "data-quality.json": {"year": 2026, "quality": {}},
            "statistics.json": {"year": 2026, "statistics": {"totalEntries": 1}},
        }
        for filename, payload in payloads.items():
            (legacy / filename).write_text(json.dumps(payload), encoding="utf-8")
        root_payloads = {
            filename: json.loads(json.dumps(payload)) for filename, payload in payloads.items()
        }
        root_payloads["competitions.json"].pop("year")
        root_payloads["raw-extracted-results.json"].pop("year")
        root_payloads["results.json"].pop("year")
        root_payloads["data-quality.json"].pop("year")
        root_payloads["statistics.json"].pop("year")
        root_payloads["competitions.json"]["sourceUrl"] = "https://portal.mdlsz.com/racecalendar?year=2026"
        for filename, payload in root_payloads.items():
            (data_dir / filename).write_text(json.dumps(payload), encoding="utf-8")
        (data_dir / "pdfs").mkdir()
        (data_dir / "pdfs" / "legacy.pdf").write_bytes(b"legacy")

        plan = migration.migrate(data_dir, dry_run=True)
        self.assertEqual(len(plan), 2)
        self.assertTrue(legacy.exists())
        migration.migrate(data_dir)

        migrated = data_dir / "idpa" / "2026"
        archived = data_dir / "idpa" / "legacy-root"
        self.assertEqual(json.loads((migrated / "results.json").read_text())["results"], payloads["results.json"]["results"])
        self.assertEqual(json.loads((migrated / "results.json").read_text())["discipline"], "idpa")
        self.assertEqual(json.loads((migrated / "results.json").read_text())["year"], 2026)
        self.assertEqual(json.loads((migrated / "statistics.json").read_text())["analyticsVersion"], "legacy-unversioned")
        self.assertEqual(json.loads((archived / "results.json").read_text())["discipline"], "idpa")
        self.assertEqual((archived / "pdfs" / "legacy.pdf").read_bytes(), b"legacy")
        self.assertFalse((data_dir / "competitions.json").exists())
        self.assertFalse(legacy.exists())

        migration.migrate(data_dir)
        self.assertTrue(migrated.exists())


if __name__ == "__main__":
    unittest.main()
