"""LLM individual diabetes risk predictor for national what-if simulation.

Uses the configured LLM provider only — never XGBoost or classical ensembles.
"""

from __future__ import annotations

from typing import Literal

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.ai.llm_factory import get_llm

_SYSTEM = """\
You are a clinical diabetes risk specialist producing a what-if risk simulation \
for public-health planners. Score diabetes risk from the structured inputs only.

Return:
- probability_percent: 0-100 estimated probability of diabetes / prediabetes progression concern
- risk_level: low | moderate | high
- category_label: short clinical category (e.g. Normal Glycemic Range, Prediabetes Tendency)
- confidence_percent: 0-100 confidence in this assessment
- top_factors: 2-4 short labels naming dominant input drivers (e.g. "Fasting glucose", "BMI")

Do NOT invent labs not provided. Do NOT recommend XGBoost or other model brands.
This is a simulation and is not a diagnosis.
"""

_HUMAN = """\
What-if profile:
- Age: {age}
- Gender: {gender}
- BMI: {bmi}
- Fasting glucose (mg/dL): {glucose}
- Family history of diabetes: {family_history}
- Physical activity: {activity}

Produce a structured risk prediction.
"""


class IndividualPrediction(BaseModel):
    probability_percent: float = Field(ge=0, le=100)
    risk_level: Literal["low", "moderate", "high"]
    category_label: str
    confidence_percent: float = Field(ge=0, le=100)
    top_factors: list[str] = Field(min_length=1, max_length=4)


def build_predictor_prompt_vars(
    age: float,
    gender: str,
    bmi: float,
    glucose: float,
    family_history: str,
    activity: str,
) -> dict[str, str]:
    """Allowlisted prompt fields only — never accept arbitrary PII blobs."""
    return {
        "age": str(age),
        "gender": gender,
        "bmi": str(bmi),
        "glucose": str(glucose),
        "family_history": family_history,
        "activity": activity,
    }


def run_individual_prediction(
    age: float,
    gender: str,
    bmi: float,
    glucose: float,
    family_history: str,
    activity: str,
) -> IndividualPrediction:
    vars_ = build_predictor_prompt_vars(age, gender, bmi, glucose, family_history, activity)
    # Guard: only allowlisted keys reach the LLM
    assert set(vars_.keys()) == {
        "age",
        "gender",
        "bmi",
        "glucose",
        "family_history",
        "activity",
    }
    llm = get_llm().with_structured_output(IndividualPrediction)
    prompt = ChatPromptTemplate.from_messages([("system", _SYSTEM), ("human", _HUMAN)])
    return (prompt | llm).invoke(vars_)
