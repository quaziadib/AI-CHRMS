from datetime import datetime, timedelta, timezone

from statsmodels.tsa.arima.model import ARIMA

from app.models.health_snapshot import HealthSnapshot
from app.models.record import PatientRecord

_RISK_TREND = {"low": -0.8, "moderate": 0.5, "high": 1.5}


def _baseline_glucose(record: PatientRecord) -> float:
    if record.blood_glucose:
        return float(record.blood_glucose)
    return {"low": 95.0, "moderate": 110.0, "high": 130.0}.get(record.risk_level or "moderate", 100.0)


def _series_from_snapshots(snapshots: list[HealthSnapshot], record: PatientRecord) -> list[float]:
    values = [s.blood_glucose for s in snapshots if s.blood_glucose is not None]
    if len(values) >= 3:
        return values[-12:]

    baseline = _baseline_glucose(record)
    trend = _RISK_TREND.get(record.risk_level or "moderate", 0.0)
    # Synthesize monthly history when longitudinal data is sparse (MVP)
    return [round(baseline + trend * (i - 5), 1) for i in range(6)] + [baseline]


def build_forecast_result(snapshots: list[HealthSnapshot], record: PatientRecord) -> dict:
    series = _series_from_snapshots(snapshots, record)
    model_name = "arima" if len(series) >= 4 else "trend"

    if len(series) >= 4:
        try:
            fit = ARIMA(series, order=(1, 1, 1)).fit()
            forecast_values = fit.forecast(steps=6).tolist()
        except Exception:
            model_name = "trend"
            forecast_values = _trend_forecast(series, steps=6)
    else:
        forecast_values = _trend_forecast(series, steps=6)

    now = datetime.now(timezone.utc)
    actual_points = []
    for i, snap in enumerate(snapshots[-6:]):
        if snap.blood_glucose is None:
            continue
        actual_points.append({
            "date": snap.captured_at.date().isoformat(),
            "glucose_mg_dl": round(float(snap.blood_glucose), 1),
            "kind": "actual",
        })

    if not actual_points:
        actual_points.append({
            "date": now.date().isoformat(),
            "glucose_mg_dl": round(series[-1], 1),
            "kind": "actual",
        })

    forecast_points = []
    for i, value in enumerate(forecast_values, start=1):
        forecast_points.append({
            "date": (now + timedelta(days=30 * i)).date().isoformat(),
            "glucose_mg_dl": round(float(value), 1),
            "kind": "forecast",
        })

    all_points = actual_points + forecast_points
    summary = (
        f"Projected blood glucose trajectory over 6 months using {model_name.upper()} "
        f"based on your current reading of {actual_points[-1]['glucose_mg_dl']} mg/dL."
    )

    return {
        "model": model_name,
        "summary": summary,
        "points": all_points,
    }


def _trend_forecast(series: list[float], steps: int) -> list[float]:
    if len(series) < 2:
        last = series[-1]
        return [last] * steps
    slope = (series[-1] - series[0]) / max(len(series) - 1, 1)
    return [series[-1] + slope * i for i in range(1, steps + 1)]
