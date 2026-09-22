"""LLM national epidemic forecast (urban/rural)."""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.ai.llm_factory import get_llm
from app.services.anonymization import assert_no_pii


class YearPoint(BaseModel):
    year: int
    urban_prevalence_percent: float = Field(ge=0, le=100)
    rural_prevalence_percent: float = Field(ge=0, le=100)


class RiskGroupShare(BaseModel):
    key: str  # low | prediabetes | high
    label: str
    population_share_percent: float = Field(ge=0, le=100)
    guidance: str


class EpidemicForecastResult(BaseModel):
    series: list[YearPoint] = Field(min_length=5, max_length=8)
    risk_groups: list[RiskGroupShare] = Field(min_length=3, max_length=3)
    summary: str


_SYSTEM = """\
You are a Bangladesh public-health epidemiologist. Using ONLY the anonymized \
aggregate summary provided, produce an illustrative multi-year diabetes \
prevalence forecast for urban vs rural populations.

Requirements:
- Exactly 6 year points from 2024 through 2034 (every 2 years).
- Exactly 3 risk groups with keys: low, prediabetes, high (shares ~sum to 100).
- Keep summary ≤2 sentences; keep each guidance ≤1 short sentence.
- Label uncertainty; do not invent patient identifiers.
"""

_HUMAN = """\
Anonymized national aggregate summary:
{aggregates_text}

Produce the structured epidemic forecast.
"""


def _clip(text: str, limit: int) -> str:
    text = (text or "").strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def run_epidemic_forecast(aggregates_text: str) -> EpidemicForecastResult:
    assert "email" not in aggregates_text.lower()
    assert "user_id" not in aggregates_text.lower()
    # Structured multi-year payload needs headroom beyond the default 1024.
    llm = get_llm(max_tokens=4096).with_structured_output(EpidemicForecastResult)
    prompt = ChatPromptTemplate.from_messages([("system", _SYSTEM), ("human", _HUMAN)])
    result = (prompt | llm).invoke({"aggregates_text": aggregates_text[:6000]})
    result.summary = _clip(result.summary, 800)
    for group in result.risk_groups:
        group.guidance = _clip(group.guidance, 240)
    payload = result.model_dump()
    assert_no_pii(payload)
    return result
