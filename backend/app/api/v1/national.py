from fastapi import APIRouter, HTTPException, Query, Response, status

from app.api.deps import DB, NationalAdminUser
from app.core.config import settings
from app.ai.pattern_discovery_chain import run_pattern_discovery
from app.ai.individual_predictor_chain import run_individual_prediction
from app.schemas.national import (
    DemographicsChartResponse,
    DivisionForecastRequest,
    DistrictSummaryResponse,
    DivisionChartResponse,
    GeoListResponse,
    GeoOption,
    IndividualPredictRequest,
    IndividualPredictResponse,
    NationalMapSummaryResponse,
    PatternDiscoveryResponse,
    PatternInsight,
    PopulationForecastJobResponse,
    ResourceAllocationResponse,
    SpatialDistrictMetric,
    SpatialPanelResponse,
)
from app.services import national as national_service
from app.services import population_forecast as pop_forecast_service
from app.services import bd_geo
from app.services import national_charts
from app.services import national_map
from app.services.anonymization import public_district_summaries
from app.services.audit import log_audit

router = APIRouter()


def _require_national_analytics() -> None:
    if not settings.ENABLE_NATIONAL_ANALYTICS:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="National analytics is disabled",
        )


@router.get("/geo/divisions", response_model=GeoListResponse)
def geo_divisions(user: NationalAdminUser, db: DB):
    _require_national_analytics()
    return GeoListResponse(items=[GeoOption(**d) for d in national_map.division_options(db)])


@router.get("/geo/districts", response_model=GeoListResponse)
def geo_districts(user: NationalAdminUser, db: DB, division_id: str = Query(...)):
    _require_national_analytics()
    return GeoListResponse(items=[GeoOption(**d) for d in national_map.district_options(db, division_id)])


@router.get("/geo/upazillas", response_model=GeoListResponse)
def geo_upazillas(user: NationalAdminUser, district_id: str = Query(...)):
    _require_national_analytics()
    # Patient records currently store district only; finer geography is not collected.
    return GeoListResponse(items=[])


@router.get("/geo/thanas", response_model=GeoListResponse)
def geo_thanas(user: NationalAdminUser, upazilla_id: str = Query(...)):
    _require_national_analytics()
    return GeoListResponse(items=[])


@router.get("/spatial", response_model=SpatialPanelResponse)
def get_spatial_panel(
    user: NationalAdminUser,
    db: DB,
    division_id: str = Query("dhaka"),
    district_id: str | None = Query(None),
):
    _require_national_analytics()
    data = national_charts.spatial_panel(division_id, district_id, db)
    return SpatialPanelResponse(
        title=data["title"],
        division_id=data["division_id"],
        district_id=data.get("district_id"),
        districts=[SpatialDistrictMetric(**district) for district in data["districts"]],
        metrics=data["metrics"],
        metric_basis=data["metric_basis"],
    )


@router.get("/charts/divisions", response_model=DivisionChartResponse)
def chart_divisions(user: NationalAdminUser, db: DB):
    _require_national_analytics()
    return DivisionChartResponse(**national_charts.division_prevalence_chart(db))


@router.get("/charts/demographics", response_model=DemographicsChartResponse)
def chart_demographics(user: NationalAdminUser, db: DB):
    _require_national_analytics()
    return DemographicsChartResponse(**national_charts.demographics_chart(db))


@router.post("/predict-individual", response_model=IndividualPredictResponse)
def predict_individual(body: IndividualPredictRequest, user: NationalAdminUser):
    _require_national_analytics()
    if not settings.ENABLE_NATIONAL_INDIVIDUAL_PREDICTOR:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="National individual predictor is disabled",
        )
    result = run_individual_prediction(
        age=body.age,
        gender=body.gender,
        bmi=body.bmi,
        glucose=body.glucose,
        family_history=body.family_history,
        activity=body.activity,
    )
    return IndividualPredictResponse(
        probability_percent=result.probability_percent,
        risk_level=result.risk_level,
        category_label=result.category_label,
        confidence_percent=result.confidence_percent,
        top_factors=result.top_factors,
        engine="llm",
        persisted=False,
    )


@router.post("/epidemic-forecast", response_model=PopulationForecastJobResponse, status_code=202)
def enqueue_epidemic_forecast(user: NationalAdminUser, db: DB):
    _require_national_analytics()
    if not settings.ENABLE_POPULATION_FORECASTING:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Population forecasting is disabled",
        )
    job = pop_forecast_service.enqueue_epidemic_forecast(db, user.id)
    return PopulationForecastJobResponse.model_validate(job)


@router.get("/epidemic-forecast/latest", response_model=PopulationForecastJobResponse)
def latest_epidemic_forecast(user: NationalAdminUser, db: DB):
    _require_national_analytics()
    if not settings.ENABLE_POPULATION_FORECASTING:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Population forecasting is disabled",
        )
    job = pop_forecast_service.get_latest_epidemic_forecast(db)
    if not job:
        raise HTTPException(status_code=404, detail="No epidemic forecast jobs found")
    return PopulationForecastJobResponse.model_validate(job)


@router.post("/division-forecasts", response_model=PopulationForecastJobResponse, status_code=202)
def enqueue_division_forecast(body: DivisionForecastRequest, user: NationalAdminUser, db: DB):
    _require_national_analytics()
    if not settings.ENABLE_POPULATION_FORECASTING:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Population forecasting is disabled",
        )
    valid_scopes = {division["id"] for division in bd_geo.list_divisions()} | {"all"}
    if body.scope_id not in valid_scopes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unknown division forecast scope")
    job = pop_forecast_service.enqueue_division_forecast(db, user.id, body.scope_id)
    return PopulationForecastJobResponse.model_validate(job)


@router.get("/division-forecasts/latest", response_model=PopulationForecastJobResponse)
def latest_division_forecast(
    user: NationalAdminUser,
    db: DB,
    scope_id: str = Query(...),
):
    _require_national_analytics()
    if not settings.ENABLE_POPULATION_FORECASTING:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Population forecasting is disabled",
        )
    valid_scopes = {division["id"] for division in bd_geo.list_divisions()} | {"all"}
    if scope_id not in valid_scopes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unknown division forecast scope")
    job = pop_forecast_service.get_latest_division_forecast(db, scope_id)
    if not job:
        raise HTTPException(status_code=404, detail="No division forecast job found for this scope")
    return PopulationForecastJobResponse.model_validate(job)


@router.get("/districts/summary", response_model=DistrictSummaryResponse)
def get_district_summary(user: NationalAdminUser, db: DB):
    _require_national_analytics()
    districts = public_district_summaries(db)
    return DistrictSummaryResponse(
        districts=districts,
        generated_at=national_service.utc_now_iso(),
        min_cell_size=settings.NATIONAL_MIN_CELL_SIZE,
    )


@router.get("/map/summary", response_model=NationalMapSummaryResponse)
def get_map_summary(user: NationalAdminUser, db: DB):
    _require_national_analytics()
    return NationalMapSummaryResponse(**national_map.map_summary(db))


@router.get("/resources", response_model=ResourceAllocationResponse)
def get_resources(user: NationalAdminUser, db: DB):
    _require_national_analytics()
    return ResourceAllocationResponse(
        resources=national_service.build_resource_estimates(db),
        generated_at=national_service.utc_now_iso(),
    )


@router.get("/export.csv")
def export_csv(user: NationalAdminUser, db: DB):
    _require_national_analytics()
    content = national_service.district_summary_csv(db)
    log_audit(
        db,
        user_id=user.id,
        action="national_analytics_exported",
        entity_type="national_analytics",
        entity_id=None,
    )
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="national-district-summary.csv"'},
    )


@router.post("/forecasts", response_model=PopulationForecastJobResponse, status_code=202)
def enqueue_forecast(user: NationalAdminUser, db: DB):
    _require_national_analytics()
    if not settings.ENABLE_POPULATION_FORECASTING:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Population forecasting is disabled",
        )
    job = pop_forecast_service.enqueue_population_forecast(db, user.id)
    return PopulationForecastJobResponse.model_validate(job)


@router.get("/forecasts/latest", response_model=PopulationForecastJobResponse)
def latest_forecast(user: NationalAdminUser, db: DB):
    _require_national_analytics()
    if not settings.ENABLE_POPULATION_FORECASTING:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Population forecasting is disabled",
        )
    job = pop_forecast_service.get_latest_population_forecast(db)
    if not job:
        raise HTTPException(status_code=404, detail="No population forecast jobs found")
    return PopulationForecastJobResponse.model_validate(job)


@router.post("/patterns", response_model=PatternDiscoveryResponse)
def discover_patterns(user: NationalAdminUser, db: DB):
    _require_national_analytics()
    if not settings.ENABLE_PATTERN_DISCOVERY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Pattern discovery is disabled",
        )

    aggregates = public_district_summaries(db)
    usable = [r for r in aggregates if not r.get("suppressed") and (r.get("record_count") or 0) > 0]
    if not usable:
        return PatternDiscoveryResponse(
            insights=[],
            generated_at=national_service.utc_now_iso(),
            insufficient_data=True,
        )

    result = run_pattern_discovery(aggregates)
    log_audit(
        db,
        user_id=user.id,
        action="national_pattern_discovery",
        entity_type="national_analytics",
        entity_id=None,
    )
    return PatternDiscoveryResponse(
        insights=[PatternInsight(statement=i.statement, caveat=i.caveat) for i in result.insights],
        generated_at=national_service.utc_now_iso(),
        insufficient_data=False,
    )
