from __future__ import annotations

import subprocess
import sys

from common import ANALYTICS_DISCIPLINES, REPO_ROOT, parse_pipeline_args


def main() -> None:
    paths = parse_pipeline_args("Run all data pipeline stages for one discipline and season.")
    scripts = [
        "discover-competitions.py",
        "download-results.py",
        "extract-pdfs.py",
        "normalize-data.py",
    ]
    if paths.discipline in ANALYTICS_DISCIPLINES:
        scripts.append("calculate-statistics.py")
    else:
        scripts.append("validate-ingestion.py")

    for script in scripts:
        subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "scripts" / script),
                "--discipline",
                paths.discipline,
                "--year",
                str(paths.year),
            ],
            check=True,
        )


if __name__ == "__main__":
    main()
