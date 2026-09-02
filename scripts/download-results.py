from __future__ import annotations

from pathlib import Path

from bs4 import BeautifulSoup

from common import COMPETITIONS_PATH, PDF_DIR, ensure_dirs, fetch, load_json, make_session, now_iso, resolve_url, save_json


def discover_result_link(session, competition: dict) -> tuple[str | None, str | None]:
    source_url = competition.get("sourceUrl")
    if not source_url:
        return None, "Missing source URL"

    if source_url.lower().endswith(".pdf"):
        return source_url, None

    response = fetch(session, source_url)
    soup = BeautifulSoup(response.text, "lxml")
    candidates = []
    for anchor in soup.find_all("a", href=True):
        label = anchor.get_text(" ", strip=True).lower()
        href = resolve_url(source_url, anchor["href"])
        if not href:
            continue
        if "eredm" in label or href.lower().endswith(".pdf"):
            candidates.append(href)
    for candidate in candidates:
        if candidate.lower().endswith(".pdf"):
            return candidate, None
    return (candidates[0], None) if candidates else (None, "Eredmények link not found")


def download_pdf(session, url: str, target_path: Path) -> None:
    response = fetch(session, url)
    target_path.write_bytes(response.content)


def main() -> None:
    ensure_dirs()
    competitions_file = load_json(COMPETITIONS_PATH, {"competitions": [], "errors": []})
    competitions = competitions_file.get("competitions", [])
    errors = competitions_file.get("errors", [])
    session = make_session()

    for competition in competitions:
        try:
            pdf_url, discovery_error = discover_result_link(session, competition)
            competition["resultPdfUrl"] = pdf_url
            if discovery_error:
                competition["downloadStatus"] = "missing"
                competition["downloadError"] = discovery_error
                continue
            if not pdf_url:
                competition["downloadStatus"] = "missing"
                competition["downloadError"] = "Result PDF URL missing"
                continue
            target_path = PDF_DIR / f"{competition['id']}.pdf"
            download_pdf(session, pdf_url, target_path)
            competition["resultPdfPath"] = str(target_path.relative_to(PDF_DIR.parent))
            competition["downloadStatus"] = "downloaded"
            competition.pop("downloadError", None)
        except Exception as error:  # noqa: BLE001
            competition["downloadStatus"] = "failed"
            competition["downloadError"] = str(error)

    payload = {
        **competitions_file,
        "generatedAt": now_iso(),
        "competitions": competitions,
        "errors": errors,
    }
    save_json(COMPETITIONS_PATH, payload)


if __name__ == "__main__":
    main()
