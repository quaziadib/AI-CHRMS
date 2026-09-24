"""Bangladesh division reference labels used with database-backed geography."""

from __future__ import annotations

# Stable division identifiers are reference metadata for the bundled boundaries.
# Which divisions and districts are offered to users is derived from patient_records.
DIVISIONS: list[dict[str, str]] = [
    {"id": "dhaka", "name": "Dhaka Division"},
    {"id": "chittagong", "name": "Chittagong Division"},
    {"id": "rajshahi", "name": "Rajshahi Division"},
    {"id": "khulna", "name": "Khulna Division"},
    {"id": "sylhet", "name": "Sylhet Division"},
    {"id": "barisal", "name": "Barisal Division"},
    {"id": "rangpur", "name": "Rangpur Division"},
    {"id": "mymensingh", "name": "Mymensingh Division"},
]

DIVISION_DISPLAY = {division["id"]: division["name"] for division in DIVISIONS}
DIVISION_DISPLAY["other"] = "Other"


def list_divisions() -> list[dict[str, str]]:
    """Return division reference labels for validating forecast scopes."""
    return list(DIVISIONS)
