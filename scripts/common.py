from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urljoin, urlsplit, urlunsplit

import requests

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = Path(os.getenv("IDPA_DATA_DIR", REPO_ROOT / "data"))
CLUB_ALIASES_PATH = REPO_ROOT / "data" / "club-aliases.json"
REQUEST_TIMEOUT = int(os.getenv("MDLSZ_REQUEST_TIMEOUT", "60"))
USER_AGENT = os.getenv(
    "MDLSZ_USER_AGENT",
    "mdlsz-idpa-analytics/1.0 (+https://github.com/dbreuer/idpa-analytics)",
)
DISCIPLINE_ALIASES = {
    "idpa": ("IDPA", "International Defensive Pistol Association"),
    "ipsc": ("IPSC", "International Practical Shooting Confederation"),
    "imssu": ("IMSSU", "International Metallic Silhouette Shooting Union"),
    "gyorskombinalt": ("Gyorskombinált",),
    "steel-challenge": ("Steel Challenge",),
    "gyorspont-es-hazai-versenyszamok": ("Gyorspont és hazai versenyszámok", "Gyorspont"),
    "iprf": ("IPRF", "International Precision Rifle Federation"),
}
SUPPORTED_PIPELINE_DISCIPLINES = frozenset({"idpa"})

@dataclass(frozen=True)
class PipelinePaths:
    discipline: str
    year: int
    data_dir: Path
    pdf_dir: Path
    competitions: Path
    raw_extracted: Path
    results: Path
    statistics: Path
    quality: Path
    calendar_url: str


def parse_year(value: str) -> int:
    if not re.fullmatch(r"[1-9]\d{3}", value):
        raise argparse.ArgumentTypeError("year must be a four-digit year (1000-9999)")
    return int(value)


def pipeline_paths(year: int, discipline: str = "idpa") -> PipelinePaths:
    if not 1000 <= year <= 9999:
        raise ValueError("year must be between 1000 and 9999")
    if discipline not in DISCIPLINE_ALIASES:
        raise ValueError(f"Unknown discipline: {discipline}")
    if discipline not in SUPPORTED_PIPELINE_DISCIPLINES:
        raise ValueError(f"The {discipline} pipeline adapter is not implemented yet")
    directory = DATA_DIR / discipline / str(year)
    calendar = urlsplit(os.getenv("MDLSZ_CALENDAR_URL", "https://portal.mdlsz.com/racecalendar"))
    query = [(key, value) for key, value in parse_qsl(calendar.query) if key != "year"]
    query.append(("year", str(year)))
    return PipelinePaths(
        discipline=discipline,
        year=year,
        data_dir=directory,
        pdf_dir=directory / "pdfs",
        competitions=directory / "competitions.json",
        raw_extracted=directory / "raw-extracted-results.json",
        results=directory / "results.json",
        statistics=directory / "statistics.json",
        quality=directory / "data-quality.json",
        calendar_url=urlunsplit(calendar._replace(query=urlencode(query))),
    )


def parse_pipeline_args(description: str) -> PipelinePaths:
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument(
        "--discipline",
        choices=sorted(DISCIPLINE_ALIASES),
        default="idpa",
        help="Discipline slug (default: idpa; other adapters are not yet available)",
    )
    parser.add_argument("--year", type=parse_year, default=datetime.now().year, help="Season year (default: current year)")
    arguments = parser.parse_args()
    try:
        return pipeline_paths(arguments.year, arguments.discipline)
    except ValueError as error:
        parser.error(str(error))


def validate_payload_scope(payload: dict[str, Any], paths: PipelinePaths, label: str) -> None:
    if payload.get("discipline") != paths.discipline:
        raise ValueError(
            f"{label} discipline mismatch: expected {paths.discipline}, "
            f"got {payload.get('discipline')!r}"
        )
    if payload.get("year") != paths.year:
        raise ValueError(
            f"{label} year mismatch: expected {paths.year}, got {payload.get('year')!r}"
        )
    if payload.get("schemaVersion") != 1:
        raise ValueError(f"{label} has an unsupported or missing schema version")


HEADER_ALIASES = {
    "placement": ["helyezes", "helyezés", "sorszam", "sorszám", "rank"],
    "name": ["nev", "név", "competitor", "versenyzo", "versenyző"],
    "club_team": ["egyesulet / csapat", "egyesület / csapat", "club / team", "csapat", "egyesulet", "egyesület"],
    "category": ["kategoria", "kategória", "category"],
    "division": ["divizio", "divízió", "division"],
    "result": ["eredmeny", "eredmény", "score", "result"],
    "notes": ["megjegyzesek", "megjegyzések", "megjegyzes", "megjegyzés", "notes"],
}

# Result PDFs print a metadata block (organizer/location/date/division, etc.) as
# label/value pairs above the actual competitor table, one table per division.
METADATA_KEYS = {
    "szervezo": "organizer",
    "helyszin": "location",
    "datum": "date",
    "szakag": "discipline",
    "verseny tipusa": "competitionType",
    "verseny tipus": "competitionType",
    "divizio": "division",
}

# Divisions are printed as "CODE - Hungarian description" except a few that
# only carry the English name, so those are mapped explicitly to their code.
DIVISION_NAME_TO_CODE = {
    "carry optic": "CO",
    "carry optics": "CO",
    "back up gun": "BUG",
    "backup gun": "BUG",
}


def parse_division_code(value: str | None) -> str | None:
    text = normalize_text(value)
    if not text:
        return None
    if " - " in text:
        return text.split(" - ", 1)[0].strip().upper()
    return DIVISION_NAME_TO_CODE.get(normalize_key(text), text.upper())


def parse_metadata_row(row: list[str]) -> dict[str, str]:
    metadata: dict[str, str] = {}
    cells = [normalize_text(cell) for cell in row]
    index = 0
    while index < len(cells) - 1:
        label = cells[index]
        if label.endswith(":"):
            field = METADATA_KEYS.get(normalize_key(label.rstrip(":")))
            value = cells[index + 1]
            if field and value:
                metadata[field] = value
            index += 2
        else:
            index += 1
    return metadata


def split_table_rows(rows: list[list[str]]) -> tuple[dict[str, str], list[str], dict[str, int], list[list[str]]]:
    """Split raw PDF table rows into the metadata block, the real column header, and data rows."""
    metadata: dict[str, str] = {}
    header: list[str] = []
    header_map: dict[str, int] = {}
    data_rows: list[list[str]] = []
    header_found = False
    for row in rows:
        if not header_found:
            candidate_map = identify_header(row)
            if "name" in candidate_map and "placement" in candidate_map:
                header, header_map, header_found = row, candidate_map, True
                continue
            metadata.update(parse_metadata_row(row))
            continue
        data_rows.append(row)
    return metadata, header, header_map, data_rows


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_dirs(paths: PipelinePaths) -> None:
    paths.pdf_dir.mkdir(parents=True, exist_ok=True)


def save_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_json(path: Path, fallback: Any = ...) -> Any:
    if not path.exists():
        if fallback is not ...:
            return fallback
        raise FileNotFoundError(f"Required pipeline input missing: {path}. Run the previous stage for this year first.")
    return json.loads(path.read_text(encoding="utf-8"))


def make_session() -> requests.Session:
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    return session


def fetch(session: requests.Session, url: str) -> requests.Response:
    response = session.get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return response


def normalize_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def normalize_key(value: str | None) -> str:
    text = normalize_text(value).lower()
    replacements = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ö": "o",
        "ő": "o",
        "ú": "u",
        "ü": "u",
        "ű": "u",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return text


def slugify(value: str) -> str:
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", normalize_key(value)))


def resolve_url(base_url: str, href: str | None) -> str | None:
    if not href:
        return None
    return urljoin(base_url, href)


def identify_header(header_row: list[str]) -> dict[str, int]:
    mapping: dict[str, int] = {}
    normalized_headers = [normalize_key(cell) for cell in header_row]
    for canonical, aliases in HEADER_ALIASES.items():
        for index, header in enumerate(normalized_headers):
            if any(alias in header for alias in aliases):
                mapping[canonical] = index
                break
    return mapping
