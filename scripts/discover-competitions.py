from __future__ import annotations

from bs4 import BeautifulSoup

from common import ensure_dirs, fetch, make_session, normalize_key, normalize_text, now_iso, parse_pipeline_args, resolve_url, save_json, slugify


def main() -> None:
    paths = parse_pipeline_args("Discover IDPA competitions for one season.")
    ensure_dirs(paths)
    errors: list[str] = []
    competitions: list[dict] = []

    try:
        response = fetch(make_session(), paths.calendar_url)
        soup = BeautifulSoup(response.text, "lxml")
        rows = soup.select("table tr")
        for row in rows:
            cells = row.find_all(["td", "th"])
            values = [normalize_text(cell.get_text(" ", strip=True)) for cell in cells]
            if len(values) < 5:
                continue
            discipline = next((value for value in values if normalize_key(value) == "idpa"), None)
            if not discipline:
                continue
            date = next((value for value in values if value.startswith(str(paths.year))), "")
            if not date.startswith(str(paths.year)):
                continue
            links = row.find_all("a", href=True)
            name = values[1] if len(values) > 1 else values[0]
            location = values[4] if len(values) > 4 else ""
            source_url = resolve_url(paths.calendar_url, links[0]["href"] if links else None) or paths.calendar_url
            code = values[6] if len(values) > 6 else None
            competition_id = slugify(code or f"{date}-{name}")
            competitions.append(
                {
                    "id": competition_id,
                    "name": name,
                    "date": date,
                    "location": location or None,
                    "sourceUrl": source_url,
                    "discipline": discipline,
                    "level": values[3] if len(values) > 3 else None,
                    "organizer": values[5] if len(values) > 5 else None,
                    "code": code,
                    "resultPdfUrl": None,
                    "downloadStatus": "pending",
                }
            )
    except Exception as error:  # noqa: BLE001
        errors.append(f"Failed to discover competitions from {paths.calendar_url}: {error}")

    payload = {
        "generatedAt": now_iso(),
        "year": paths.year,
        "sourceUrl": paths.calendar_url,
        "discoveredCount": len(competitions),
        "competitions": competitions,
        "errors": errors,
    }
    save_json(paths.competitions, payload)
    if errors:
        raise SystemExit("\n".join(errors))


if __name__ == "__main__":
    main()
