"""Load the doctor and patient datasets into the database DATABASE_URL points at.

    python -m app.scripts.ingest_datasets --dry-run
    python -m app.scripts.ingest_datasets

Works the same against local and production; it does not depend on SEED_* flags.
Exit codes: 0 ok (rejected rows are reported, not fatal), 1 database error,
2 unreadable/invalid file.
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.base import engine
from app.services.dataset_ingest import (
    DatasetFileError,
    FileReport,
    ingest_doctors,
    ingest_patients,
)

SEED_DIR = Path(__file__).resolve().parent.parent / "data" / "seed"
DEFAULT_DOCTORS = SEED_DIR / "doctors_100.csv"
DEFAULT_PATIENTS = SEED_DIR / "patients_1000.csv"
# Guards against a truncated bundled file; skipped for --doctors/--patients overrides.
EXPECTED_ROWS = {DEFAULT_DOCTORS: 100, DEFAULT_PATIENTS: 1000}

logger = logging.getLogger("ingest_datasets")


def _count_rows(path: Path) -> int:
    import csv

    with open(path, encoding="utf-8-sig", newline="") as f:
        return sum(1 for _ in csv.DictReader(f))


def _print_report(report: FileReport) -> None:
    print(report.summary())
    for line, reason in report.rejected:
        print(f"  rejected line {line}: {reason}")
    for warning in report.warnings:
        print(f"  warning: {warning}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="validate and report; write nothing")
    parser.add_argument("--doctors", type=Path, default=DEFAULT_DOCTORS)
    parser.add_argument("--patients", type=Path, default=DEFAULT_PATIENTS)
    args = parser.parse_args(argv)
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    url = make_url(settings.DATABASE_URL)
    print(f"Target database: host={url.host} port={url.port} db={url.database}"
          f"{'  (DRY RUN)' if args.dry_run else ''}")

    jobs = [("doctors", args.doctors, ingest_doctors), ("patients", args.patients, ingest_patients)]

    try:
        for _label, path, _fn in jobs:
            expected = EXPECTED_ROWS.get(path)
            if expected is not None:
                actual = _count_rows(path)  # DatasetFileError is raised below if unreadable
                if actual != expected:
                    raise DatasetFileError(f"{path.name}: expected {expected} rows, found {actual}")
    except (DatasetFileError, OSError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    try:
        with Session(engine) as db:
            for _label, path, fn in jobs:
                try:
                    _print_report(fn(db, path, dry_run=args.dry_run))
                except DatasetFileError as exc:
                    print(f"ERROR: {exc}", file=sys.stderr)
                    return 2
    except SQLAlchemyError as exc:
        print(f"ERROR: database failure: {type(exc).__name__}: {str(exc).splitlines()[0]}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
