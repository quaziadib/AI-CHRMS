"""Population-level district forecasting from anonymized monthly series."""

from __future__ import annotations


def _trend_forecast(series: list[float], steps: int) -> list[float]:
    if not series:
        return [0.0] * steps
    if len(series) < 2:
        last = series[-1]
        return [max(0.0, last)] * steps
    slope = (series[-1] - series[0]) / max(len(series) - 1, 1)
    return [max(0.0, series[-1] + slope * i) for i in range(1, steps + 1)]


def forecast_district_series(points: list[dict]) -> dict:
    """Return 6/12 month projections for record_count and high_risk.

    points: [{month, record_count, high_risk}, ...] ordered ascending.
    """
    if not points:
        return {
            "status": "unavailable",
            "model": "none",
            "high_risk_6m": None,
            "high_risk_12m": None,
            "record_count_6m": None,
            "record_count_12m": None,
        }

    high_series = [float(p["high_risk"]) for p in points]
    count_series = [float(p["record_count"]) for p in points]

    if len(points) >= 4:
        try:
            from statsmodels.tsa.arima.model import ARIMA

            high_fit = ARIMA(high_series, order=(1, 1, 1)).fit()
            count_fit = ARIMA(count_series, order=(1, 1, 1)).fit()
            high_fc = [max(0.0, float(v)) for v in high_fit.forecast(steps=12).tolist()]
            count_fc = [max(0.0, float(v)) for v in count_fit.forecast(steps=12).tolist()]
            model = "arima"
        except Exception:
            high_fc = _trend_forecast(high_series, 12)
            count_fc = _trend_forecast(count_series, 12)
            model = "trend"
    elif len(points) >= 2:
        high_fc = _trend_forecast(high_series, 12)
        count_fc = _trend_forecast(count_series, 12)
        model = "trend"
    else:
        # Flat fallback — insufficient history
        high_fc = [high_series[-1]] * 12
        count_fc = [count_series[-1]] * 12
        model = "flat"

    return {
        "status": "ok",
        "model": model,
        "high_risk_6m": round(high_fc[5], 2),
        "high_risk_12m": round(high_fc[11], 2),
        "record_count_6m": round(count_fc[5], 2),
        "record_count_12m": round(count_fc[11], 2),
        "history_points": len(points),
    }


def build_population_forecast_result(series_by_district: dict[str, list[dict]]) -> dict:
    districts = []
    for district, points in sorted(series_by_district.items()):
        forecast = forecast_district_series(points)
        districts.append({"district": district, **forecast})
    return {"districts": districts}
