from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

SEASON_FILES = (
    "competitions.json",
    "raw-extracted-results.json",
    "results.json",
    "data-quality.json",
    "statistics.json",
)
ROOT_PIPELINE_FILES = SEASON_FILES


def read_payload(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError(f"Expected a JSON object: {path}")
    return payload


def validate_season(directory: Path, year: int) -> None:
    payloads = {name: read_payload(directory / name) for name in SEASON_FILES}
    for name, payload in payloads.items():
        if payload.get("year", year) != year:
            raise ValueError(f"{directory / name} belongs to a different year")
        if payload.get("discipline", "idpa") != "idpa":
            raise ValueError(f"{directory / name} is not IDPA data")
    competitions = payloads["competitions.json"].get("competitions", [])
    if any(str(competition.get("date", ""))[:4] != str(year) for competition in competitions):
        raise ValueError(f"{directory} contains competitions from a different year")
    results = payloads["results.json"].get("results", [])
    if any(str(result.get("competitionDate", ""))[:4] != str(year) for result in results):
        raise ValueError(f"{directory} contains results from a different year")


def add_metadata(directory: Path, year: int) -> None:
    for name in SEASON_FILES:
        path = directory / name
        payload = read_payload(path)
        if (
            payload.get("discipline") == "idpa"
            and payload.get("year") == year
            and payload.get("schemaVersion") == 1
        ):
            continue
        payload["discipline"] = "idpa"
        payload["year"] = year
        payload["schemaVersion"] = 1
        if name == "statistics.json":
            payload.setdefault("analyticsVersion", "legacy-unversioned")
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def legacy_root_year(data_dir: Path) -> int | None:
    competition_file = data_dir / "competitions.json"
    if not competition_file.exists():
        return None
    payload = read_payload(competition_file)
    year = payload.get("year")
    if year is None:
        years = {
            str(item.get("date", ""))[:4]
            for item in payload.get("competitions", [])
            if str(item.get("date", ""))[:4].isdigit()
        }
        if len(years) == 1:
            year = next(iter(years))
        else:
            source_year = parse_qs(urlsplit(payload.get("sourceUrl", "")).query).get("year", [])
            if len(source_year) != 1:
                raise ValueError(f"Cannot infer a single season from {competition_file}")
            year = source_year[0]
    if isinstance(year, str) and year.isdigit():
        year = int(year)
    if not isinstance(year, int) or not 1000 <= year <= 9999:
        raise ValueError(f"Invalid legacy season year in {competition_file}")
    return year


def migrate(data_dir: Path, dry_run: bool = False) -> list[tuple[Path, Path]]:
    sources = sorted(
        (entry for entry in data_dir.iterdir() if entry.is_dir() and len(entry.name) == 4 and entry.name.isdigit()),
        key=lambda item: item.name,
    )
    idpa_dir = data_dir / "idpa"
    existing_seasons = []
    if idpa_dir.exists():
        existing_seasons = sorted(
            (
                entry
                for entry in idpa_dir.iterdir()
                if entry.is_dir() and len(entry.name) == 4 and entry.name.isdigit()
            ),
            key=lambda item: item.name,
        )
        for destination in existing_seasons:
            validate_season(destination, int(destination.name))
        archive = idpa_dir / "legacy-root"
        if archive.is_dir() and all((archive / name).is_file() for name in SEASON_FILES):
            archive_year = legacy_root_year(archive)
            if archive_year is not None:
                validate_season(archive, archive_year)
    destinations: list[tuple[Path, Path]] = []
    for source in sources:
        year = int(source.name)
        missing = [name for name in SEASON_FILES if not (source / name).is_file()]
        if missing:
            raise ValueError(f"Incomplete season {source}: missing {', '.join(missing)}")
        validate_season(source, year)
        destination = idpa_dir / source.name
        if destination.exists():
            raise FileExistsError(f"Refusing to overwrite existing season data: {destination}")
        destinations.append((source, destination))

    root_files = [data_dir / name for name in ROOT_PIPELINE_FILES if (data_dir / name).is_file()]
    if root_files and len(root_files) != len(ROOT_PIPELINE_FILES):
        raise ValueError("Root-level legacy season data is incomplete; refusing a partial migration")
    root_pdfs = data_dir / "pdfs"
    if root_files:
        year = legacy_root_year(data_dir)
        if year is None:
            raise ValueError("Cannot infer legacy season year")
        for name in ROOT_PIPELINE_FILES:
            payload = read_payload(data_dir / name)
            if payload.get("year", year) != year or payload.get("discipline", "idpa") != "idpa":
                raise ValueError(f"Root-level legacy file belongs to a different season or discipline: {name}")
        archive = idpa_dir / "legacy-root"
        collisions = [archive / path.name for path in root_files]
        if root_pdfs.exists():
            collisions.append(archive / "pdfs")
        if archive.exists() or any(target.exists() for target in collisions):
            raise FileExistsError(f"Refusing to overwrite legacy archive: {archive}")

    if dry_run:
        planned = list(destinations)
        if root_files:
            planned.append((data_dir / "legacy-root", idpa_dir / "legacy-root"))
        return planned

    idpa_dir.mkdir(exist_ok=True)
    for source, destination in destinations:
        source.rename(destination)
    for directory in [*existing_seasons, *(destination for _, destination in destinations)]:
        add_metadata(directory, int(directory.name))
    archive = idpa_dir / "legacy-root"
    if archive.is_dir() and all((archive / name).is_file() for name in SEASON_FILES):
        archive_year = legacy_root_year(archive)
        if archive_year is None:
            raise ValueError("Cannot determine the archived legacy season year")
        add_metadata(archive, archive_year)
    if root_files:
        archive = idpa_dir / "legacy-root"
        archive.mkdir()
        for path in root_files:
            path.rename(archive / path.name)
        if root_pdfs.exists():
            root_pdfs.rename(archive / "pdfs")
        year = legacy_root_year(archive)
        if year is None:
            raise ValueError("Cannot determine the archived legacy season year")
        add_metadata(archive, year)
    completed = list(destinations)
    if root_files:
        completed.append((data_dir / "legacy-root", idpa_dir / "legacy-root"))
    return completed


def main() -> None:
    parser = argparse.ArgumentParser(description="Move legacy season data into discipline-scoped folders.")
    parser.add_argument("--data-dir", type=Path, default=Path(__file__).resolve().parents[1] / "data")
    parser.add_argument("--dry-run", action="store_true")
    arguments = parser.parse_args()
    for source, destination in migrate(arguments.data_dir, dry_run=arguments.dry_run):
        print(f"{'Would move' if arguments.dry_run else 'Moved'} {source} -> {destination}")


if __name__ == "__main__":
    main()
