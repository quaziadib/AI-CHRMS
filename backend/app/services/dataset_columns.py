"""Single source of truth for dataset CSV columns.

Ingestion parses with ``parse`` and export writes with ``fmt`` from the same
``Column`` objects, so the two directions cannot drift apart.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Any, Callable

# --- cell parsers: str -> value, raise ValueError on bad input -------------

_TRUE = {"true", "1", "yes"}
_FALSE = {"false", "0", "no"}
_FORMULA_CHARS = ("=", "+", "-", "@")


def _strip(raw: str | None) -> str:
    return (raw or "").strip()


def parse_str(raw: str | None) -> str:
    v = _strip(raw)
    if not v:
        raise ValueError("required")
    return unguard(v)


def parse_str_opt(raw: str | None) -> str | None:
    v = _strip(raw)
    return unguard(v) if v else None


def parse_int(raw: str | None) -> int:
    v = _strip(raw)
    if not v:
        raise ValueError("required")
    try:
        return int(v)
    except ValueError:
        raise ValueError(f"not an integer: {v!r}") from None


def parse_int_opt(raw: str | None) -> int | None:
    return parse_int(raw) if _strip(raw) else None


def parse_float(raw: str | None) -> float:
    v = _strip(raw)
    if not v:
        raise ValueError("required")
    try:
        return float(v)
    except ValueError:
        raise ValueError(f"not a number: {v!r}") from None


def parse_float_opt(raw: str | None) -> float | None:
    return parse_float(raw) if _strip(raw) else None


def parse_bool(raw: str | None) -> bool:
    v = _strip(raw).lower()
    if v in _TRUE:
        return True
    if v in _FALSE:
        return False
    raise ValueError(f"not a boolean: {raw!r}")


def parse_uuid(raw: str | None) -> str:
    v = _strip(raw)
    try:
        return str(uuid.UUID(v))
    except ValueError:
        raise ValueError(f"not a UUID: {v!r}") from None


# --- cell formatters: value -> str ------------------------------------------


def guard(text: str) -> str:
    """Neutralize spreadsheet formula injection (cells starting with = + - @)."""
    return "'" + text if text.startswith(_FORMULA_CHARS) else text


def unguard(text: str) -> str:
    """Inverse of ``guard``: drop the leading quote only when guard() would have added it."""
    if len(text) > 1 and text[0] == "'" and text[1] in "".join(_FORMULA_CHARS):
        return text[1:]
    return text


def fmt_text(value: Any) -> str:
    return "" if value is None else guard(str(value))


def fmt_plain(value: Any) -> str:
    """Numbers: never guarded, so negative values stay numeric."""
    return "" if value is None else str(value)


def fmt_bool(value: Any) -> str:
    return "" if value is None else ("True" if value else "False")


# --- doctor-specific transforms ---------------------------------------------

# CSV spelling -> app division display name (see services/bd_geo.py)
_DIVISION_TO_APP = {"Chattogram": "Chittagong Division", "Barishal": "Barisal Division"}
_DIVISION_TO_CSV = {v: k for k, v in _DIVISION_TO_APP.items()}


def division_to_app(csv_value: str) -> str:
    v = csv_value.strip()
    if not v:
        raise ValueError("required")
    if v.endswith(" Division"):
        return v
    return _DIVISION_TO_APP.get(v, f"{v} Division")


def division_to_csv(app_value: str | None) -> str:
    if not app_value:
        return ""
    if app_value in _DIVISION_TO_CSV:
        return _DIVISION_TO_CSV[app_value]
    return app_value.removesuffix(" Division")


def parse_affiliations(raw: str | None) -> list[str]:
    return [p.strip() for p in (raw or "").split(";") if p.strip()]


def fmt_affiliations(value: list[str] | None) -> str:
    return guard("; ".join(value or [])) if value else ""


# --- column specs -----------------------------------------------------------


@dataclass(frozen=True)
class Column:
    name: str  # CSV header; also the attribute name on the flat row dict
    parse: Callable[[str | None], Any]
    fmt: Callable[[Any], str]


def _c(name: str, parse: Callable, fmt: Callable) -> Column:
    return Column(name, parse, fmt)


# Doctor rows are a flat dict combining account + profile attributes.
# `password_hash` is read by import only to be ignored; export omits it.
DOCTOR_IMPORT_COLUMNS: list[Column] = [
    _c("id", parse_uuid, fmt_plain),
    _c("name", parse_str, fmt_text),
    _c("email", lambda r: parse_str(r).lower(), fmt_text),
    _c("phone", parse_str_opt, fmt_text),
    _c("id_pic", parse_str_opt, fmt_text),
    _c("password_hash", parse_str_opt, lambda _v: ""),
    _c("specialization", parse_str, fmt_text),
    _c("affiliations", parse_affiliations, fmt_affiliations),
    _c("division", division_to_app, lambda v: fmt_text(division_to_csv(v))),
    _c("district", parse_str, fmt_text),
    _c("location", parse_str, fmt_text),
    _c("is_active", parse_bool, fmt_bool),
    _c("is_verified", parse_bool, fmt_bool),
]

DOCTOR_EXPORT_COLUMNS: list[Column] = [c for c in DOCTOR_IMPORT_COLUMNS if c.name != "password_hash"]

PATIENT_COLUMNS: list[Column] = [
    _c("id", parse_uuid, fmt_plain),
    _c("user_id", parse_uuid, fmt_plain),
    _c("pid", parse_str, fmt_text),
    _c("age", parse_int, fmt_plain),
    _c("gender", parse_str, fmt_text),
    _c("district", parse_str, fmt_text),
    _c("family_diabetes", parse_bool, fmt_bool),
    _c("family_hypertension", parse_bool, fmt_bool),
    _c("family_cvd", parse_bool, fmt_bool),
    _c("family_stroke", parse_bool, fmt_bool),
    _c("diabetes_history", parse_bool, fmt_bool),
    _c("hypertension", parse_bool, fmt_bool),
    _c("cvd", parse_bool, fmt_bool),
    _c("stroke", parse_bool, fmt_bool),
    _c("allergies", parse_str_opt, fmt_text),
    _c("pregnancies", parse_int_opt, fmt_plain),
    _c("bp_systolic", parse_int, fmt_plain),
    _c("bp_diastolic", parse_int, fmt_plain),
    _c("height", parse_float, fmt_plain),
    _c("weight", parse_float, fmt_plain),
    _c("bmi", parse_float, fmt_plain),
    _c("pulse_rate", parse_int, fmt_plain),
    _c("blood_glucose", parse_float_opt, fmt_plain),
    _c("cholesterol", parse_float_opt, fmt_plain),
    _c("hemoglobin", parse_float_opt, fmt_plain),
    _c("creatinine", parse_float_opt, fmt_plain),
    _c("ecg_result", parse_str_opt, fmt_text),
    _c("symptoms", parse_str_opt, fmt_text),
    _c("diagnosis", parse_str_opt, fmt_text),
    _c("smoking", parse_str, fmt_text),
    _c("physical_activity", parse_str, fmt_text),
    _c("alcohol", parse_str, fmt_text),
    _c("sleep_hours", parse_float, fmt_plain),
    _c("sound_sleep", parse_bool, fmt_bool),
]


def parse_row(columns: list[Column], raw: dict[str, str]) -> tuple[dict[str, Any], list[str]]:
    """Parse one CSV row. Returns (values, errors); errors are 'column: reason'."""
    values: dict[str, Any] = {}
    errors: list[str] = []
    for col in columns:
        try:
            values[col.name] = col.parse(raw.get(col.name))
        except ValueError as exc:
            errors.append(f"{col.name}: {exc}")
    return values, errors


def format_row(columns: list[Column], values: dict[str, Any]) -> list[str]:
    return [col.fmt(values.get(col.name)) for col in columns]


def check_header(columns: list[Column], header: list[str] | None) -> list[str]:
    """Return required column names missing from the CSV header."""
    present = set(header or [])
    return [c.name for c in columns if c.name not in present]
