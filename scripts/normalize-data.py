from __future__ import annotations

import re
from collections import Counter, defaultdict

from common import CLUB_ALIASES_PATH, club_match_key, ensure_dirs, identify_header, load_json, normalize_key, normalize_text, now_iso, parse_pipeline_args, parse_division_code, save_json, validate_payload_scope


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


def unify_club_spellings(results: list[dict], aliases: dict[str, str]) -> None:
    """Sets normalizedClub to the season's most frequent published spelling of each club.

    `club` keeps each row's own spelling; only grouping uses club_match_key."""
    spellings: dict[str, Counter] = defaultdict(Counter)
    for result in results:
        if result.get("club"):
            aliased = canonical_club(result["club"], aliases)
            spellings[club_match_key(aliased)][aliased] += 1
    preferred = {
        key: min(counts.items(), key=lambda item: (-item[1], item[0]))[0]
        for key, counts in spellings.items()
    }
    for result in results:
        if result.get("club"):
            result["normalizedClub"] = preferred[club_match_key(canonical_club(result["club"], aliases))]


def parse_notes(value: str | None, discipline: str = "idpa") -> dict:
    raw = normalize_text(value)
    if not raw:
        return {"rawNotes": None}
    parsed: dict = {"rawNotes": raw}
    if discipline != "idpa":
        return parsed
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


def is_combined_club_team_header(label: str | None) -> bool:
    """MDLSZ sheets use a single "Egyesület" column; only an explicit "club / team" header carries a team."""
    key = normalize_key(label)
    return "/" in key or "csapat" in key or "team" in key


def split_club_team(value: str | None, combined_header: bool = True) -> tuple[str | None, str | None]:
    raw = normalize_text(value)
    if not raw:
        return None, None
    if not combined_header:
        return raw, None
    parts = [part.strip() for part in re.split(r"\s*[\/|,-]\s*", raw) if part.strip()]
    if len(parts) >= 2:
        return parts[0], " / ".join(parts[1:])
    return raw, None


def normalize_license_id(value: str | None) -> str | None:
    raw = normalize_text(value)
    return raw if raw.isdigit() and raw.strip("0") else None


def main() -> None:
    paths = parse_pipeline_args("Normalize competitor results for one discipline and season.")
    ensure_dirs(paths)
    competitions_file = load_json(paths.competitions)
    extracted = load_json(paths.raw_extracted)
    validate_payload_scope(competitions_file, paths, str(paths.competitions))
    validate_payload_scope(extracted, paths, str(paths.raw_extracted))
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
            row_map = table.get("headerMap") or identify_header(header)
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
                if "club_team" in header_map and len(padded_row) > header_map["club_team"]:
                    club_raw = padded_row[header_map["club_team"]]
                    club_header = header[header_map["club_team"]] if header_map["club_team"] < len(header) else ""
                    club, team = split_club_team(club_raw, is_combined_club_team_header(club_header))
                else:
                    club_raw = None
                    club, team = None, None
                notes_raw = (
                    padded_row[header_map["notes"]]
                    if "notes" in header_map and len(padded_row) > header_map["notes"]
                    else None
                )
                parsed_notes = parse_notes(notes_raw, paths.discipline)
                if parsed_notes.get("timeSeconds") is not None:
                    quality["rowsWithValidTime"] += 1
                if parsed_notes.get("parseError"):
                    parsing_errors.append({"competitionId": extraction.get("competitionId"), "row": raw_row, "error": "Failed to parse notes"})
                    quality["rowsWithParsingErrors"] += 1
                # Displayed as rows without club data; tables with no club column count too.
                if not club and not team:
                    quality["rowsWithMissingTeam"] += 1

                raw_division = (
                    padded_row[row_map["division"]]
                    if "division" in row_map and len(padded_row) > row_map["division"]
                    else table.get("metadata", {}).get("division")
                )
                division = (
                    parse_division_code(raw_division)
                    if paths.discipline == "idpa"
                    else normalize_text(raw_division) or None
                )
                raw_result = (
                    normalize_text(padded_row[header_map["result"]])
                    if "result" in header_map and len(padded_row) > header_map["result"]
                    else None
                )
                result = {
                    "competitionId": extraction.get("competitionId"),
                    "competitionName": competition.get("name"),
                    "competitionDate": competition.get("date"),
                    "placement": parse_placement(padded_row[header_map.get("placement", 0)] if padded_row else ""),
                    "rawPlacement": padded_row[header_map.get("placement", 0)] if padded_row else "",
                    "competitorName": identity["displayName"],
                    "normalizedCompetitorName": identity["normalizedName"],
                    "competitorIdentity": identity,
                    "competitorLicenseId": normalize_license_id(
                        padded_row[header_map["license"]]
                        if "license" in header_map and len(padded_row) > header_map["license"]
                        else None
                    ),
                    "team": team,
                    "normalizedTeam": normalize_text(team),
                    "club": club,
                    "normalizedClub": canonical_club(club or "", aliases) if club else None,
                    "division": division,
                    "category": (normalize_text(padded_row[header_map["category"]]) or None) if "category" in header_map and len(padded_row) > header_map["category"] else None,
                    "classification": (normalize_text(padded_row[header_map["classification"]]) or None) if "classification" in header_map and len(padded_row) > header_map["classification"] else None,
                    "powerFactor": (normalize_text(padded_row[header_map["powerFactor"]]) or None) if "powerFactor" in header_map and len(padded_row) > header_map["powerFactor"] else None,
                    "resultPercentage": (normalize_text(padded_row[header_map["percentage"]]) or None) if "percentage" in header_map and len(padded_row) > header_map["percentage"] else None,
                    "rawResult": raw_result or None,
                    "rawClubTeam": club_raw,
                    "rawRow": raw_row,
                    **parsed_notes,
                }
                results.append(result)
                quality["validCompetitorRows"] += 1

    unify_club_spellings(results, aliases)

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
        paths.results,
        {
            "generatedAt": now_iso(),
            "discipline": paths.discipline,
            "year": paths.year,
            "schemaVersion": 1,
            "results": results,
            "parsingErrors": parsing_errors,
            "ambiguousCompetitors": ambiguous_competitors,
        },
    )
    save_json(
        paths.quality,
        {
            "generatedAt": now_iso(),
            "discipline": paths.discipline,
            "year": paths.year,
            "schemaVersion": 1,
            "quality": quality,
            "errors": extracted.get("errors", []),
        },
    )


if __name__ == "__main__":
    main()
