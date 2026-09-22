"""LLM pattern discovery over anonymized national aggregates only."""

from __future__ import annotations

import json

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.ai.llm_factory import get_llm
from app.services.anonymization import FORBIDDEN_FIELDS, assert_no_pii

_SYSTEM_PROMPT = """\
You are a public-health analyst for Bangladesh diabetes surveillance.
You receive ONLY anonymized district-level aggregate statistics (no patient identifiers).
Return 2-5 short insight statements about risk patterns or resource pressure.
Each insight must include a caveat that data is exploratory and not causal.
Do not invent districts that are not in the input. Do not request or invent PII.
"""

_HUMAN_PROMPT = """\
Anonymized district aggregates (JSON):

{aggregates_json}

Generate pattern insights for national health planners.
"""


class PatternInsightModel(BaseModel):
    statement: str = Field(description="One insight about anonymized aggregates")
    caveat: str = Field(description="Short caveat that this is exploratory / not causal")


class PatternDiscoveryResult(BaseModel):
    insights: list[PatternInsightModel] = Field(min_length=1, max_length=5)


def sanitize_aggregates_for_llm(aggregates: list[dict]) -> list[dict]:
    """Drop suppressed rows' nulls noise and forbid any PII keys."""
    cleaned: list[dict] = []
    for row in aggregates:
        if any(k in FORBIDDEN_FIELDS for k in row):
            raise ValueError("PII key present in aggregates for pattern discovery")
        if row.get("suppressed"):
            cleaned.append({"district": row["district"], "suppressed": True})
        else:
            cleaned.append(
                {
                    "district": row["district"],
                    "record_count": row.get("record_count"),
                    "low_risk": row.get("low_risk"),
                    "moderate_risk": row.get("moderate_risk"),
                    "high_risk": row.get("high_risk"),
                    "high_risk_rate": row.get("high_risk_rate"),
                }
            )
    assert_no_pii(cleaned)
    return cleaned


def run_pattern_discovery(aggregates: list[dict]) -> PatternDiscoveryResult:
    sanitized = sanitize_aggregates_for_llm(aggregates)
    usable = [r for r in sanitized if not r.get("suppressed")]
    if not usable:
        return PatternDiscoveryResult(
            insights=[
                PatternInsightModel(
                    statement="Insufficient anonymized aggregate data for pattern analysis.",
                    caveat="Collect more district-scored records before interpreting national patterns.",
                )
            ]
        )

    llm = get_llm().with_structured_output(PatternDiscoveryResult)
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", _SYSTEM_PROMPT),
            ("human", _HUMAN_PROMPT),
        ]
    )
    chain = prompt | llm
    return chain.invoke({"aggregates_json": json.dumps(usable, indent=2)})
