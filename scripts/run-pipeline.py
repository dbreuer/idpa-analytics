from __future__ import annotations

import subprocess
import sys

from common import REPO_ROOT, parse_pipeline_args


def main() -> None:
    paths = parse_pipeline_args("Run all data pipeline stages for one season.")
    for script in (
        "discover-competitions.py",
        "download-results.py",
        "extract-pdfs.py",
        "normalize-data.py",
        "calculate-statistics.py",
    ):
        subprocess.run(
            [sys.executable, str(REPO_ROOT / "scripts" / script), "--year", str(paths.year)],
            check=True,
        )


if __name__ == "__main__":
    main()
