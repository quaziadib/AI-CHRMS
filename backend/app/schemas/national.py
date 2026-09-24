from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.base import OrmSchema


class DistrictSummary(BaseModel):
    district: str
    suppressed: bool = False
    record_count: int | None = None
    low_risk: int | None = None
    moderate_risk: int | None = None
    high_risk: int | None = None
    unscored: int | None = None
    high_risk_rate: float | None = None
    latest_record_at: str | None = None


class DistrictSummaryResponse(BaseModel):
    districts: list[DistrictSummary]
    generated_at: str
    min_cell_size: int


class NationalMapMetric(BaseModel):
    id: str
    name: str
    status: str
    high_risk_share: float | None = None


class NationalMapSummaryResponse(BaseModel):
    generated_at: str
    metric_basis: str
    minimum_cell_size: int
    attribution: str
    divisions: list[NationalMapMetric]
    districts: list[NationalMapMetric]


class DivisionForecastRequest(BaseModel):
    scope_id: str = Field(min_length=1, max_length=32)


class ResourceEstimate(BaseModel):
    district: str
    suppressed: bool = False
    projected_high_risk: float | None = None
    testing_kits: int | None = None
    medicine_packs: int | None = None
    clinic_sites: int | None = None
    source: str = "burden"


class ResourceAllocationResponse(BaseModel):
    resources: list[ResourceEstimate]
    generated_at: str


class PopulationForecastJobResponse(OrmSchema):
    id: str
    status: str
    result: dict | None = None
    error_message: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class PatternInsight(BaseModel):
    statement: str
    caveat: str | None = None


class PatternDiscoveryResponse(BaseModel):
    insights: list[PatternInsight] = Field(default_factory=list)
    generated_at: str
    insufficient_data: bool = False


class GeoOption(BaseModel):
    id: str
    name: str


class GeoListResponse(BaseModel):
    items: list[GeoOption]


class IndividualPredictRequest(BaseModel):
    age: float = Field(ge=15, le=100)
    gender: str
    bmi: float = Field(gt=0, le=80)
    glucose: float = Field(gt=0, le=600)
    family_history: str
    activity: str


class IndividualPredictResponse(BaseModel):
    probability_percent: float
    risk_level: str
    category_label: str
    confidence_percent: float
    top_factors: list[str]
    engine: str = "llm"
    persisted: bool = False


class DivisionChartResponse(BaseModel):
    labels: list[str]
    high_risk_share_percent: list[float | None]
    national_high_risk_share_percent: float | None
    empty: bool


class DemographicsChartResponse(BaseModel):
    labels: list[str]
    male_high_risk_share_percent: list[float | None]
    female_high_risk_share_percent: list[float | None]
    empty: bool


class SpatialDistrictMetric(BaseModel):
    label: str
    rate: float
    severity: str
    source: str = "database"


class SpatialPanelResponse(BaseModel):
    title: str
    division_id: str
    district_id: str | None = None
    districts: list[SpatialDistrictMetric]
    metrics: dict
    metric_basis: str
