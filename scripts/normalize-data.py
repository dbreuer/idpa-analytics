from __future__ import annotations

import re
from collections import defaultdict

from common import CLUB_ALIASES_PATH, COMPETITIONS_PATH, QUALITY_PATH, RAW_EXTRACTED_PATH, RESULTS_PATH, ensure_dirs, identify_header, load_json, normalize_key, normalize_text, now_iso, parse_division_code, save_json


PLACEMENT_PATTERN = re.compile(r"(\d+)")
LICENSE_PATTERN = re.compile(r"([A-Z]{2}\d{4,})", re.IGNORECASE)
TIME_PATTERN = re.compile(r"(\d+[,.]\d+|\d+)")


def normalize_name(name: str) -> dict:
    display_name = normalize_text(name)
    return {
        "displayName": display_name,
        "normalizedName": normalize_key(display_name).replace(" ", "-"),
    }


def canonical_club(raw_value: str, aliases: dict[str, str]) -> str:
    value = normalize_text(raw_value)
    return aliases.get(value, value)


def parse_notes(value: str | None) -> dict:
    raw = normalize_text(value)
    if not raw:
        return {"rawNotes": None}
    parsed: dict = {"rawNotes": raw}
    license_match = LICENSE_PATTERN.search(raw)
    if license_match:
        parsed["competitionLicenseId"] = license_match.group(1).upper()
    time_match = TIME_PATTERN.search(raw)
    if time_match:
        parsed["timeSeconds"] = float(time_match.group(1).replace(",", "."))
    if "competitionLicenseId" not in parsed and "timeSeconds" not in parsed:
        parsed["parseError"] = True
    return parsed


def parse_placement(value: str | None) -> int | None:
    raw = normalize_text(value)
    if not raw:
        return None
    match = PLACEMENT_PATTERN.search(raw)
    return int(match.group(1)) if match else None


def split_club_team(value: str | None) -> tuple[str | None, str | None]:
    raw = normalize_text(value)
    if not raw:
        return None, None
    parts = [part.strip() for part in re.split(r"\s*[\/|,-]\s*", raw) if part.strip()]
    if len(parts) >= 2:
        return parts[0], " / ".join(parts[1:])
    return raw, None


def main() -> None:
    ensure_dirs()
    competitions_file = load_json(COMPETITIONS_PATH, {"competitions": []})
    extracted = load_json(RAW_EXTRACTED_PATH, {"extractions": []})
    aliases = load_json(CLUB_ALIASES_PATH, {})
    competitions_by_id = {item["id"]: item for item in competitions_file.get("competitions", [])}

    results: list[dict] = []
    parsing_errors: list[dict] = []
    ambiguous_competitors: list[dict] = []
    quality = {
        "totalPdfsDiscovered": sum(1 for competition in competitions_file.get("competitions", []) if competition.get("resultPdfUrl")),
        "successfullyProcessedPdfs": 0,
        "failedPdfs": 0,
        "totalExtractedRows": 0,
        "validCompetitorRows": 0,
        "rowsWithValidTime": 0,
        "rowsWithMissingTeam": 0,
        "rowsWithParsingErrors": 0,
    }

    competitor_variants: dict[str, set[str]] = defaultdict(set)

    for extraction in extracted.get("extractions", []):
        competition = competitions_by_id.get(extraction.get("competitionId"), {})
        tables = extraction.get("tables", [])
        if extraction.get("status") == "processed":
            quality["successfullyProcessedPdfs"] += 1
        elif competition.get("resultPdfUrl"):
            quality["failedPdfs"] += 1

        for table in tables:
            header = table.get("header", [])
            header_map = table.get("headerMap") or identify_header(header)
            division = parse_division_code(table.get("metadata", {}).get("division"))
            for row in table.get("rows", []):
                if not any(normalize_text(cell) for cell in row):
                    continue
                if [normalize_key(cell) for cell in row] == [normalize_key(cell) for cell in header]:
                    continue
                padded_row = row + [""] * max(0, len(header) - len(row))
                raw_row = {header[index] if index < len(header) else f"column_{index}": padded_row[index] for index in range(len(padded_row))}
                quality["totalExtractedRows"] += 1

                competitor_name = padded_row[header_map.get("name", 1)] if len(padded_row) > header_map.get("name", 1) else ""
                if not normalize_text(competitor_name):
                    parsing_errors.append({"competitionId": extraction.get("competitionId"), "row": raw_row, "error": "Missing competitor name"})
                    quality["rowsWithParsingErrors"] += 1
                    continue

                identity = normalize_name(competitor_name)
                competitor_variants[identity["normalizedName"]].add(identity["displayName"])
                club_raw = padded_row[header_map.get("club_team", 2)] if len(padded_row) > header_map.get("club_team", 2) else ""
                club, team = split_club_team(club_raw)
                notes_raw = padded_row[header_map.get("notes", len(padded_row) - 1)] if padded_row else ""
                parsed_notes = parse_notes(notes_raw)
                if parsed_notes.get("timeSeconds") is not None:
                    quality["rowsWithValidTime"] += 1
                if parsed_notes.get("parseError"):
                    parsing_errors.append({"competitionId": extraction.get("competitionId"), "row": raw_row, "error": "Failed to parse notes"})
                    quality["rowsWithParsingErrors"] += 1
                if not team:
                    quality["rowsWithMissingTeam"] += 1

                result = {
                    "competitionId": extraction.get("competitionId"),
                    "competitionName": competition.get("name"),
                    "competitionDate": competition.get("date"),
                    "placement": parse_placement(padded_row[header_map.get("placement", 0)] if padded_row else ""),
                    "rawPlacement": padded_row[header_map.get("placement", 0)] if padded_row else "",
                    "competitorName": identity["displayName"],
                    "normalizedCompetitorName": identity["normalizedName"],
                    "competitorIdentity": identity,
                    "team": team,
                    "normalizedTeam": normalize_text(team),
                    "club": club,
                    "normalizedClub": canonical_club(club or "", aliases) if club else None,
                    "division": division,
                    "category": (normalize_text(padded_row[header_map["category"]]) or None) if "category" in header_map and len(padded_row) > header_map["category"] else None,
                    "rawResult": normalize_text(padded_row[header_map.get("result", 5)] if len(padded_row) > header_map.get("result", 5) else "") or None,
                    "rawClubTeam": club_raw,
                    "rawRow": raw_row,
                    **parsed_notes,
                }
                results.append(result)
                quality["validCompetitorRows"] += 1

    for normalized_name, variants in competitor_variants.items():
        if len(variants) > 1:
            ambiguous_competitors.append(
                {
                    "normalizedName": normalized_name,
                    "variants": sorted(variants),
                    "reviewRequired": True,
                }
            )

    save_json(
        RESULTS_PATH,
        {
            "generatedAt": now_iso(),
            "results": results,
            "parsingErrors": parsing_errors,
            "ambiguousCompetitors": ambiguous_competitors,
        },
    )
    save_json(QUALITY_PATH, {"generatedAt": now_iso(), "quality": quality, "errors": extracted.get("errors", [])})


if __name__ == "__main__":
    main()
