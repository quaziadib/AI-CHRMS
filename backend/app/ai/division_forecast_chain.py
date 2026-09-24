"""LLM scenario projection for anonymized annual division aggregates."""

from __future__ import annotations

import json

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.ai.llm_factory import get_llm
from app.services.anonymization import assert_no_pii


class ProjectedPoint(BaseModel):
    year: int = Field(ge=2022, le=2035)
    high_risk_share: float = Field(ge=0, le=1)


class DivisionProjection(BaseModel):
    division_id: str
    points: list[ProjectedPoint] = Field(min_length=1, max_length=9)


class DivisionForecastOutput(BaseModel):
    projections: list[DivisionProjection] = Field(default_factory=list, max_length=8)
    summary: str = Field(max_length=800)


_SYSTEM = """You produce an illustrative scenario for a Bangladesh health-planning dashboard.
Use only the annual submitted-record high-risk shares provided. These are not population
prevalence rates. Return projections only for supplied division IDs and supplied future
years. Do not create or fill historical observations, infer population counts, or invent
urban/rural splits. Keep the scenario cautious and describe uncertainty in one short summary."""

_HUMAN = """Annual anonymized observations and allowed forecast years:
{payload}

Return one projection for each eligible division ID. Each point's high_risk_share must be
a fraction from 0 to 1. Include only the exact years supplied for that division."""


def run_division_forecast(payload: dict) -> DivisionForecastOutput:
    safe = json.dumps(payload, separators=(",", ":"))
    assert "email" not in safe.lower()
    assert "user_id" not in safe.lower()
    llm = get_llm(max_tokens=4096).with_structured_output(DivisionForecastOutput)
    prompt = ChatPromptTemplate.from_messages([("system", _SYSTEM), ("human", _HUMAN)])
    result = (prompt | llm).invoke({"payload": safe[:12000]})
    assert_no_pii(result.model_dump())
    return result
