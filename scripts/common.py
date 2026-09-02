from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import requests

REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "data"
PDF_DIR = DATA_DIR / "pdfs"
RAW_EXTRACTED_PATH = DATA_DIR / "raw-extracted-results.json"
COMPETITIONS_PATH = DATA_DIR / "competitions.json"
RESULTS_PATH = DATA_DIR / "results.json"
STATISTICS_PATH = DATA_DIR / "statistics.json"
QUALITY_PATH = DATA_DIR / "data-quality.json"
CLUB_ALIASES_PATH = DATA_DIR / "club-aliases.json"

CALENDAR_URL = os.getenv("MDLSZ_CALENDAR_URL", "https://portal.mdlsz.com/racecalendar?year=2025")
REQUEST_TIMEOUT = int(os.getenv("MDLSZ_REQUEST_TIMEOUT", "30"))
USER_AGENT = os.getenv(
    "MDLSZ_USER_AGENT",
    "mdlsz-idpa-analytics/1.0 (+https://github.com/dbreuer/idpa-analytics)",
)


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


def ensure_dirs() -> None:
    DATA_DIR.mkdir(exist_ok=True)
    PDF_DIR.mkdir(exist_ok=True)


def save_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_json(path: Path, fallback: Any) -> Any:
    if not path.exists():
        return fallback
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
