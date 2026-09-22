"""Curated Bangladesh administrative geography for national RSGI dashboard."""

from __future__ import annotations

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

# division_id -> [{id, name}] — names align with PatientRecord.district values where possible
DISTRICTS: dict[str, list[dict[str, str]]] = {
    "dhaka": [
        {"id": "Dhaka", "name": "Dhaka"},
        {"id": "Gazipur", "name": "Gazipur"},
        {"id": "Narayanganj", "name": "Narayanganj"},
        {"id": "Comilla", "name": "Comilla"},
    ],
    "chittagong": [
        {"id": "Chittagong", "name": "Chittagong"},
        {"id": "Cox's Bazar", "name": "Cox's Bazar"},
        {"id": "Comilla", "name": "Comilla"},
    ],
    "rajshahi": [
        {"id": "Rajshahi", "name": "Rajshahi"},
        {"id": "Bogra", "name": "Bogra"},
    ],
    "khulna": [
        {"id": "Khulna", "name": "Khulna"},
        {"id": "Jessore", "name": "Jessore"},
    ],
    "sylhet": [
        {"id": "Sylhet", "name": "Sylhet"},
    ],
    "barisal": [
        {"id": "Barisal", "name": "Barisal"},
    ],
    "rangpur": [
        {"id": "Rangpur", "name": "Rangpur"},
        {"id": "Dinajpur", "name": "Dinajpur"},
    ],
    "mymensingh": [
        {"id": "Mymensingh", "name": "Mymensingh"},
    ],
}

UPAZILLAS: dict[str, list[dict[str, str]]] = {
    "Dhaka": [
        {"id": "tejgaon", "name": "Tejgaon Circle"},
        {"id": "gulshan", "name": "Gulshan Upazilla"},
        {"id": "mirpur", "name": "Mirpur Zone"},
        {"id": "motijheel", "name": "Motijheel Area"},
    ],
    "Gazipur": [
        {"id": "gazipur_sadar", "name": "Gazipur Sadar"},
        {"id": "tongi", "name": "Tongi Industrial Zone"},
        {"id": "sreepur", "name": "Sreepur"},
    ],
    "Narayanganj": [
        {"id": "narayanganj_sadar", "name": "Narayanganj Sadar"},
        {"id": "fatullah", "name": "Fatullah"},
    ],
    "Chittagong": [
        {"id": "kotwali", "name": "Kotwali Area"},
        {"id": "panchlaish", "name": "Panchlaish"},
    ],
    "Sylhet": [
        {"id": "sylhet_sadar", "name": "Sylhet Sadar"},
    ],
}

THANAS: dict[str, list[dict[str, str]]] = {
    "tejgaon": [
        {"id": "banani", "name": "Banani Thana"},
        {"id": "gulshan_thana", "name": "Gulshan Thana"},
        {"id": "cantonment", "name": "Cantonment Thana"},
        {"id": "badda", "name": "Badda Thana"},
    ],
    "gulshan": [
        {"id": "gulshan_1", "name": "Gulshan Model Thana"},
        {"id": "baridhara", "name": "Baridhara Diplomatic Zone"},
    ],
    "gazipur_sadar": [
        {"id": "joydebpur", "name": "Joydebpur Thana"},
        {"id": "salna", "name": "Salna Outpost"},
    ],
    "mirpur": [
        {"id": "mirpur_model", "name": "Mirpur Model Thana"},
    ],
}

# PatientRecord.district string -> division id
DISTRICT_TO_DIVISION: dict[str, str] = {}
for _div_id, _districts in DISTRICTS.items():
    for _d in _districts:
        DISTRICT_TO_DIVISION[_d["id"]] = _div_id
        DISTRICT_TO_DIVISION[_d["name"]] = _div_id

# Extra aliases from health-form list
DISTRICT_TO_DIVISION.update(
    {
        "Other": "other",
    }
)

DIVISION_DISPLAY = {d["id"]: d["name"] for d in DIVISIONS}
DIVISION_DISPLAY["other"] = "Other"


def list_divisions() -> list[dict[str, str]]:
    return list(DIVISIONS)


def list_districts(division_id: str) -> list[dict[str, str]]:
    return list(DISTRICTS.get(division_id, [{"id": "Other", "name": "Other"}]))


def list_upazillas(district_id: str) -> list[dict[str, str]]:
    return list(UPAZILLAS.get(district_id, [{"id": "central", "name": "Central Upazilla"}]))


def list_thanas(upazilla_id: str) -> list[dict[str, str]]:
    return list(THANAS.get(upazilla_id, [{"id": "metro_north", "name": "Metropolitan Thana North"}]))


def division_for_district(district: str | None) -> str:
    if not district:
        return "other"
    return DISTRICT_TO_DIVISION.get(district, "other")


# Curated illustrative hotspots when sub-district grain is unavailable (labeled synthesis)
SPATIAL_HOTSPOTS: dict[str, list[dict]] = {
    "dhaka": [
        {"label": "Urban Core (Gulshan)", "rate": 28.4, "severity": "critical"},
        {"label": "Peri-Urban (Gazipur)", "rate": 21.2, "severity": "elevated"},
        {"label": "Industrial (Narayanganj)", "rate": 26.1, "severity": "critical"},
        {"label": "Suburban (Comilla)", "rate": 13.5, "severity": "stable"},
    ],
    "chittagong": [
        {"label": "Port City Core", "rate": 24.1, "severity": "elevated"},
        {"label": "Cox's Bazar Coastal", "rate": 18.6, "severity": "elevated"},
        {"label": "Hill Tracts Edge", "rate": 12.2, "severity": "stable"},
        {"label": "Industrial Belt", "rate": 22.8, "severity": "elevated"},
    ],
}

DEFAULT_HOTSPOTS = [
    {"label": "Urban Core", "rate": 22.0, "severity": "elevated"},
    {"label": "Peri-Urban", "rate": 17.5, "severity": "elevated"},
    {"label": "Rural Cluster", "rate": 11.2, "severity": "stable"},
    {"label": "Industrial Zone", "rate": 19.8, "severity": "elevated"},
]


def spatial_hotspots_for_division(division_id: str) -> list[dict]:
    return list(SPATIAL_HOTSPOTS.get(division_id, DEFAULT_HOTSPOTS))
