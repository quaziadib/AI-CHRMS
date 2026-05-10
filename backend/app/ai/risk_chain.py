from typing import Literal

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.ai.llm_factory import get_llm
from app.models.record import PatientRecord

_SYSTEM_PROMPT = """\
You are an expert clinical diabetes risk specialist. Given a patient's health profile, assess their diabetes risk.

Return a structured assessment with:
- risk_level: exactly one of "low", "moderate", or "high"
- explanation: 2-3 sentences in plain language naming the top 2-3 contributing factors from the patient's data
- recommendations: a list of 3-5 specific, actionable, personalised lifestyle or dietary tips based on their profile

Be precise. Reference actual values from the patient's data (e.g. "Your fasting glucose of 7.2 mmol/L...").
Do not include generic disclaimers. Do not recommend seeing a doctor as a recommendation item.
"""

_HUMAN_PROMPT = """\
Patient health profile:

Demographics:
- Age: {age}, Gender: {gender}, District: {district}

Family history:
- Diabetes: {family_diabetes}, Hypertension: {family_hypertension}, CVD: {family_cvd}, Stroke: {family_stroke}

Medical history:
- Diabetes diagnosis: {diabetes_history}, Hypertension: {hypertension}, CVD: {cvd}, Stroke: {stroke}
- Allergies: {allergies}
- Pregnancies: {pregnancies}

Vital signs:
- BP: {bp_systolic}/{bp_diastolic} mmHg, BMI: {bmi}, Pulse: {pulse_rate} bpm

Lab results:
- Blood glucose: {blood_glucose}, Cholesterol: {cholesterol}
- Hemoglobin: {hemoglobin}, Creatinine: {creatinine}
- ECG: {ecg_result}

Symptoms: {symptoms}
Diagnosis notes: {diagnosis}

Lifestyle:
- Smoking: {smoking}, Alcohol: {alcohol}
- Physical activity: {physical_activity}
- Sleep: {sleep_hours}h/night, Sound sleep: {sound_sleep}

Assess this patient's diabetes risk.
"""


class RiskAssessment(BaseModel):
    risk_level: Literal["low", "moderate", "high"] = Field(
        description="Overall diabetes risk level"
    )
    explanation: str = Field(
        description="2-3 sentence plain-language explanation naming the top contributing factors"
    )
    recommendations: list[str] = Field(
        description="3-5 specific, personalised, actionable lifestyle or dietary recommendations",
        min_length=3,
        max_length=5,
    )


def _build_context(record: PatientRecord) -> dict:
    return {
        "age": record.age,
        "gender": record.gender,
        "district": record.district,
        "family_diabetes": "Yes" if record.family_diabetes else "No",
        "family_hypertension": "Yes" if record.family_hypertension else "No",
        "family_cvd": "Yes" if record.family_cvd else "No",
        "family_stroke": "Yes" if record.family_stroke else "No",
        "diabetes_history": "Yes" if record.diabetes_history else "No",
        "hypertension": "Yes" if record.hypertension else "No",
        "cvd": "Yes" if record.cvd else "No",
        "stroke": "Yes" if record.stroke else "No",
        "allergies": record.allergies or "None reported",
        "pregnancies": record.pregnancies if record.pregnancies is not None else "N/A",
        "bp_systolic": record.bp_systolic,
        "bp_diastolic": record.bp_diastolic,
        "bmi": record.bmi,
        "pulse_rate": record.pulse_rate,
        "blood_glucose": f"{record.blood_glucose} mmol/L" if record.blood_glucose else "Not recorded",
        "cholesterol": f"{record.cholesterol} mmol/L" if record.cholesterol else "Not recorded",
        "hemoglobin": f"{record.hemoglobin} g/dL" if record.hemoglobin else "Not recorded",
        "creatinine": f"{record.creatinine} μmol/L" if record.creatinine else "Not recorded",
        "ecg_result": record.ecg_result or "Not recorded",
        "symptoms": record.symptoms or "None reported",
        "diagnosis": record.diagnosis or "None",
        "smoking": record.smoking,
        "alcohol": record.alcohol,
        "physical_activity": record.physical_activity,
        "sleep_hours": record.sleep_hours,
        "sound_sleep": "Yes" if record.sound_sleep else "No",
    }


def run_risk_chain(record: PatientRecord) -> RiskAssessment:
    llm = get_llm()
    structured_llm = llm.with_structured_output(RiskAssessment)
    prompt = ChatPromptTemplate.from_messages([
        ("system", _SYSTEM_PROMPT),
        ("human", _HUMAN_PROMPT),
    ])
    chain = prompt | structured_llm
    return chain.invoke(_build_context(record))
