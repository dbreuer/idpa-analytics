from __future__ import annotations

from pathlib import Path

import pymupdf
import pdfplumber

from common import ensure_dirs, load_json, now_iso, parse_pipeline_args, save_json, split_table_rows


def extract_with_pdfplumber(pdf_path: Path) -> list[dict]:
    tables: list[dict] = []
    last_header: list[str] = []
    last_header_map: dict[str, int] = {}
    last_metadata: dict[str, str] = {}
    with pdfplumber.open(pdf_path) as pdf:
        for page_index, page in enumerate(pdf.pages, start=1):
            extracted_tables = page.extract_tables() or []
            for table_index, table in enumerate(extracted_tables, start=1):
                rows = [[(cell or "").strip() for cell in row] for row in table if row]
                if not rows:
                    continue
                metadata, header, header_map, data_rows = split_table_rows(rows)
                if header:
                    last_header, last_header_map = header, header_map
                else:
                    # continuation page: metadata/header row isn't repeated, so reuse the previous division/columns
                    header, header_map, data_rows = last_header, last_header_map, rows
                last_metadata = metadata or last_metadata
                tables.append(
                    {
                        "page": page_index,
                        "table": table_index,
                        "strategy": "pdfplumber",
                        "metadata": metadata or last_metadata,
                        "header": header,
                        "headerMap": header_map,
                        "rows": data_rows,
                    }
                )
    return tables


def extract_with_pymupdf(pdf_path: Path) -> list[dict]:
    tables: list[dict] = []
    last_header: list[str] = []
    last_header_map: dict[str, int] = {}
    last_metadata: dict[str, str] = {}
    with pymupdf.open(pdf_path) as document:
        for page_index, page in enumerate(document, start=1):
            text = page.get_text("text")
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            if not lines:
                continue
            header_index = next((i for i, line in enumerate(lines) if "Név" in line or "Nev" in line), None)
            if header_index is None:
                continue
            all_rows = [[segment.strip() for segment in line.split("|")] for line in lines]
            metadata, header, header_map, data_rows = split_table_rows(all_rows)
            if header:
                last_header, last_header_map = header, header_map
            else:
                header, header_map, data_rows = last_header, last_header_map, all_rows
            last_metadata = metadata or last_metadata
            tables.append(
                {
                    "page": page_index,
                    "table": 1,
                    "strategy": "pymupdf-text",
                    "metadata": metadata or last_metadata,
                    "header": header,
                    "headerMap": header_map,
                    "rows": data_rows,
                }
            )
    return tables


def main() -> None:
    paths = parse_pipeline_args("Extract PDF tables for one season.")
    ensure_dirs(paths)
    competitions_file = load_json(paths.competitions)
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

        pdf_path = Path(paths.data_dir / pdf_relative_path)
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
        paths.raw_extracted,
        {"generatedAt": now_iso(), "year": paths.year, "extractions": outputs, "errors": errors},
    )


if __name__ == "__main__":
    main()
