from __future__ import annotations

import argparse
import json
from pathlib import Path

from common import ANALYTICS_DISCIPLINES, DISCIPLINE_ALIASES, normalize_key, parse_year

SEASON_FILES = (
    "competitions.json",
    "raw-extracted-results.json",
    "results.json",
    "data-quality.json",
    "statistics.json",
)


def load_scoped(directory: Path, name: str, discipline: str, year: int) -> dict:
    path = directory / name
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"{path} must contain a JSON object")
    if payload.get("discipline") != discipline or payload.get("year") != year:
        raise ValueError(f"{path} has mismatched discipline or season metadata")
    if payload.get("schemaVersion") != 1:
        raise ValueError(f"{path} has an unsupported or missing schema version")
    return payload


def validate_season(directory: Path, discipline: str, year: int) -> None:
    if discipline not in ANALYTICS_DISCIPLINES:
        raise ValueError(f"No validated scoring adapter is enabled for {discipline}.")
    missing = [name for name in SEASON_FILES if not (directory / name).is_file()]
    if missing:
        raise ValueError(f"Incomplete season data: missing {', '.join(missing)}")
    data = {name: load_scoped(directory, name, discipline, year) for name in SEASON_FILES}
    competitions_file = data["competitions.json"]
    raw_file = data["raw-extracted-results.json"]
    results_file = data["results.json"]
    quality_file = data["data-quality.json"]
    statistics_file = data["statistics.json"]
    competitions = competitions_file.get("competitions")
    results = results_file.get("results")
    aliases = {normalize_key(alias) for alias in DISCIPLINE_ALIASES[discipline]}
    if not isinstance(competitions, list) or not competitions:
        raise ValueError("The source calendar returned no competitions; refusing to publish an empty season")
    if competitions_file.get("errors"):
        raise ValueError("The source calendar reported access or parsing errors")
    for competition in competitions:
        if str(competition.get("date", ""))[:4] != str(year):
            raise ValueError(f"Competition {competition.get('id')!r} belongs to another year")
        if normalize_key(competition.get("discipline")) not in aliases:
            raise ValueError(f"Competition {competition.get('id')!r} is not in the selected discipline")
    if not isinstance(results, list) or not results:
        raise ValueError("No competitor results were extracted; refusing to replace published season data")
    competition_ids = {competition.get("id") for competition in competitions}
    for result in results:
        if str(result.get("competitionDate", ""))[:4] != str(year):
            raise ValueError(f"Result {result.get('competitionId')!r} belongs to another year")
        if result.get("competitionId") not in competition_ids:
            raise ValueError(f"Result references unknown competition {result.get('competitionId')!r}")
    if not isinstance(raw_file.get("extractions"), list):
        raise ValueError("The extraction payload is missing its table collection")
    quality = quality_file.get("quality")
    if not isinstance(quality, dict):
        raise ValueError("The data-quality payload is missing quality counters")
    for key, value in quality.items():
        if not isinstance(value, int) or value < 0:
            raise ValueError(f"Data-quality counter {key!r} is not a non-negative integer")
    if quality.get("validCompetitorRows") != len(results):
        raise ValueError("The valid competitor-row count does not match the normalized results")
    statistics = statistics_file.get("statistics")
    if not isinstance(statistics, dict):
        raise ValueError("The generated statistics payload is missing its summary")
    if statistics.get("totalCompetitions") != len(competitions):
        raise ValueError("The statistics summary does not match the discovered competition count")
    if statistics.get("uniqueCompetitors") != len({result.get("normalizedCompetitorName") for result in results}):
        raise ValueError("The statistics summary does not match the normalized competitor count")


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate a staged, discipline-scoped season before publication.")
    parser.add_argument("--discipline", required=True, choices=sorted(DISCIPLINE_ALIASES))
    parser.add_argument("--year", required=True, type=parse_year)
    parser.add_argument("--data-dir", required=True, type=Path)
    args = parser.parse_args()
    validate_season(args.data_dir / args.discipline / str(args.year), args.discipline, args.year)
    print(f"Validated {args.discipline} {args.year} with complete source, results, and statistics metadata.")


if __name__ == "__main__":
    main()
