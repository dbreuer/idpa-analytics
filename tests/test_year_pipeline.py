import argparse
import importlib.util
import json
import os
from pathlib import Path
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
        self.assertEqual(first.competitions, self.root / "2025" / "competitions.json")
        self.assertEqual(first.calendar_url, "https://portal.mdlsz.com/racecalendar?test=1&year=2025")
        self.assertEqual(second.calendar_url, "https://portal.mdlsz.com/racecalendar?test=1&year=2026")

    def test_invalid_years_are_rejected(self):
        for value in ("25", "2025/../2026", "0", "10000", "2025.5"):
            with self.subTest(value=value), self.assertRaises(argparse.ArgumentTypeError):
                common.parse_year(value)

    def test_missing_previous_stage_fails_without_empty_outputs(self):
        for name in ("download-results", "extract-pdfs", "normalize-data", "calculate-statistics"):
            module = script_module(name)
            with self.subTest(stage=name), patch.object(sys, "argv", [name, "--year", "2025"]):
                with self.assertRaisesRegex(FileNotFoundError, "previous stage"):
                    module.main()
        self.assertEqual(list((self.root / "2025").glob("*.json")), [])

    def test_two_seasons_run_without_overwriting_or_mixing_data(self):
        discover = script_module("discover-competitions")
        download = script_module("download-results")
        extract = script_module("extract-pdfs")
        normalize = script_module("normalize-data")
        statistics = script_module("calculate-statistics")
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
                self.assertEqual(json.loads(file.read_text())["year"], year)
            discovery = common.load_json(paths.competitions)
            self.assertEqual(len(discovery["competitions"]), 1)
            self.assertEqual(discovery["competitions"][0]["id"], f"race-{year}")
            self.assertEqual(discovery["competitions"][0]["resultPdfPath"], f"pdfs/race-{year}.pdf")
            result = common.load_json(paths.results)["results"][0]
            self.assertTrue(result["competitionDate"].startswith(str(year)))
            self.assertEqual(result["normalizedClub"], "Shared Club")
            self.assertEqual(common.load_json(paths.statistics)["statistics"]["totalCompetitions"], 1)
            if year == 2025:
                original_2025 = {file.name: file.read_bytes() for file in paths.data_dir.glob("*.json")}
        self.assertEqual(
            original_2025,
            {file.name: file.read_bytes() for file in (self.root / "2025").glob("*.json")},
        )
        self.assertFalse((self.root / "competitions.json").exists())

    def test_discovery_failure_is_recorded_and_stops_runner(self):
        discover = script_module("discover-competitions")
        with patch.object(sys, "argv", ["discover", "--year", "2025"]):
            with patch.object(discover, "fetch", side_effect=RuntimeError("network failed")):
                with self.assertRaisesRegex(SystemExit, "network failed"):
                    discover.main()
        self.assertIn("network failed", common.load_json(common.pipeline_paths(2025).competitions)["errors"][0])

    def test_runner_forwards_year_and_stops_on_failure(self):
        runner = script_module("run-pipeline")
        with patch.object(sys, "argv", ["pipeline", "--year", "2025"]):
            with patch.object(runner.subprocess, "run") as run:
                runner.main()
                self.assertEqual(run.call_count, 5)
                for call in run.call_args_list:
                    self.assertEqual(call.args[0][0], sys.executable)
                    self.assertEqual(call.args[0][-2:], ["--year", "2025"])
                    self.assertTrue(call.kwargs["check"])
            with patch.object(runner.subprocess, "run", side_effect=subprocess.CalledProcessError(1, "discovery")) as run:
                with self.assertRaises(subprocess.CalledProcessError):
                    runner.main()
                self.assertEqual(run.call_count, 1)


if __name__ == "__main__":
    unittest.main()
