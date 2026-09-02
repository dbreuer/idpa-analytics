from __future__ import annotations

from pathlib import Path

import fitz
import pdfplumber

from common import COMPETITIONS_PATH, RAW_EXTRACTED_PATH, ensure_dirs, identify_header, load_json, now_iso, save_json


def extract_with_pdfplumber(pdf_path: Path) -> list[dict]:
    tables: list[dict] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page_index, page in enumerate(pdf.pages, start=1):
            extracted_tables = page.extract_tables() or []
            for table_index, table in enumerate(extracted_tables, start=1):
                rows = [[(cell or "").strip() for cell in row] for row in table if row]
                if not rows:
                    continue
                tables.append(
                    {
                        "page": page_index,
                        "table": table_index,
                        "strategy": "pdfplumber",
                        "header": rows[0],
                        "headerMap": identify_header(rows[0]),
                        "rows": rows[1:],
                    }
                )
    return tables


def extract_with_pymupdf(pdf_path: Path) -> list[dict]:
    tables: list[dict] = []
    with fitz.open(pdf_path) as document:
        for page_index, page in enumerate(document, start=1):
            text = page.get_text("text")
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            if not lines:
                continue
            header_index = next((i for i, line in enumerate(lines) if "Név" in line or "Nev" in line), None)
            if header_index is None:
                continue
            header = [segment.strip() for segment in lines[header_index].split("|")]
            rows = []
            for line in lines[header_index + 1 :]:
                segments = [segment.strip() for segment in line.split("|")]
                if len(segments) >= 2:
                    rows.append(segments)
            tables.append(
                {
                    "page": page_index,
                    "table": 1,
                    "strategy": "pymupdf-text",
                    "header": header,
                    "headerMap": identify_header(header),
                    "rows": rows,
                }
            )
    return tables


def main() -> None:
    ensure_dirs()
    competitions_file = load_json(COMPETITIONS_PATH, {"competitions": []})
    outputs = []
    errors: list[str] = []

    for competition in competitions_file.get("competitions", []):
        pdf_relative_path = competition.get("resultPdfPath")
        if competition.get("downloadStatus") != "downloaded" or not pdf_relative_path:
            outputs.append(
                {
                    "competitionId": competition["id"],
                    "status": competition.get("downloadStatus", "missing"),
                    "tables": [],
                    "error": competition.get("downloadError"),
                }
            )
            continue

        pdf_path = Path(COMPETITIONS_PATH.parent / pdf_relative_path)
        try:
            tables = extract_with_pdfplumber(pdf_path)
            if not tables:
                tables = extract_with_pymupdf(pdf_path)
            outputs.append(
                {
                    "competitionId": competition["id"],
                    "status": "processed" if tables else "failed",
                    "tables": tables,
                    "error": None if tables else "No extractable tables found",
                }
            )
        except Exception as error:  # noqa: BLE001
            errors.append(f"{competition['id']}: {error}")
            outputs.append(
                {
                    "competitionId": competition["id"],
                    "status": "failed",
                    "tables": [],
                    "error": str(error),
                }
            )

    save_json(
        RAW_EXTRACTED_PATH,
        {"generatedAt": now_iso(), "extractions": outputs, "errors": errors},
    )


if __name__ == "__main__":
    main()
