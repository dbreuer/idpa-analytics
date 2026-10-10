from __future__ import annotations

import argparse
import json
from pathlib import Path

from common import ANALYTICS_DISCIPLINES, DATA_DIR, DISCIPLINE_ALIASES, normalize_key, parse_year

INGESTION_FILES = (
    "competitions.json",
    "raw-extracted-results.json",
    "results.json",
    "data-quality.json",
)


def load_payload(directory: Path, filename: str, discipline: str, year: int) -> dict:
    path = directory / filename
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"{path} must contain a JSON object")
    if payload.get("discipline") != discipline or payload.get("year") != year:
        raise ValueError(f"{path} has mismatched discipline or season metadata")
    if payload.get("schemaVersion") != 1:
        raise ValueError(f"{path} has an unsupported or missing schema version")
    return payload


def validate_ingestion(directory: Path, discipline: str, year: int) -> None:
    if discipline in ANALYTICS_DISCIPLINES:
        raise ValueError(f"Use the analytics publication validator for {discipline}.")
    missing = [filename for filename in INGESTION_FILES if not (directory / filename).is_file()]
    if missing:
        raise ValueError(f"Incomplete ingestion data: missing {', '.join(missing)}")
    if (directory / "statistics.json").exists():
        raise ValueError(
            f"{directory / 'statistics.json'} exists without a validated {discipline} analytics adapter"
        )

    data = {
        filename: load_payload(directory, filename, discipline, year)
        for filename in INGESTION_FILES
    }
    competitions_file = data["competitions.json"]
    extracted_file = data["raw-extracted-results.json"]
    results_file = data["results.json"]
    quality_file = data["data-quality.json"]
    competitions = competitions_file.get("competitions")
    extractions = extracted_file.get("extractions")
    results = results_file.get("results")
    if not isinstance(competitions, list):
        raise ValueError("The competition calendar payload is missing its competition list")
    if competitions_file.get("errors"):
        raise ValueError("The official calendar reported access or parsing errors")
    aliases = {normalize_key(alias) for alias in DISCIPLINE_ALIASES[discipline]}
    competition_ids = set()
    for competition in competitions:
        competition_id = competition.get("id")
        if not competition_id or competition_id in competition_ids:
            raise ValueError("The calendar contains a missing or duplicate competition ID")
        competition_ids.add(competition_id)
        if str(competition.get("date", ""))[:4] != str(year):
            raise ValueError(f"Competition {competition_id!r} belongs to another year")
        if normalize_key(competition.get("discipline")) not in aliases:
            raise ValueError(f"Competition {competition_id!r} is not in the selected discipline")
    if not isinstance(extractions, list):
        raise ValueError("The PDF extraction payload is missing its extraction list")
    extracted_ids = [entry.get("competitionId") for entry in extractions]
    if len(extracted_ids) != len(competition_ids) or set(extracted_ids) != competition_ids:
        raise ValueError("PDF extraction records do not match the discovered competitions")
    if not isinstance(results, list):
        raise ValueError("The normalized results payload is missing its results list")
    for result in results:
        if str(result.get("competitionDate", ""))[:4] != str(year):
            raise ValueError(f"Result {result.get('competitionId')!r} belongs to another year")
        if result.get("competitionId") not in competition_ids:
            raise ValueError(f"Result references unknown competition {result.get('competitionId')!r}")
    quality = quality_file.get("quality")
    if not isinstance(quality, dict):
        raise ValueError("The data-quality payload is missing its counters")
    for key, value in quality.items():
        if not isinstance(value, int) or value < 0:
            raise ValueError(f"Data-quality counter {key!r} is not a non-negative integer")
    if quality.get("validCompetitorRows") != len(results):
        raise ValueError("The normalized result count does not match the data-quality summary")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate discipline-aware ingestion without claiming a scoring model."
    )
    parser.add_argument("--discipline", required=True, choices=sorted(DISCIPLINE_ALIASES))
    parser.add_argument("--year", required=True, type=parse_year)
    parser.add_argument("--data-dir", type=Path)
    args = parser.parse_args()
    data_root = args.data_dir or DATA_DIR
    validate_ingestion(data_root / args.discipline / str(args.year), args.discipline, args.year)
    print(f"Validated {args.discipline} {args.year} normalized ingestion; no rankings were calculated.")


if __name__ == "__main__":
    main()
