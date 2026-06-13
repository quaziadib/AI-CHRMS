from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.ai.llm_factory import get_llm
from app.models.record import PatientRecord

_SYSTEM_PROMPT = """\
You are a diabetes health coach. Given a patient's health profile and their assessed risk level, \
generate specific, personalised recommendations organised into four categories.

Return:
- summary: one sentence of overall tailored guidance for this patient (max 20 words)
- diet: 2-3 nutrition tips — each tip is action-first, max 12 words (e.g. "Limit white rice to half-cup portions")
- exercise: 2-3 activity tips — action-first, max 12 words each
- lifestyle: 2-3 habit tips — action-first, max 12 words each
- monitoring: 1-2 check-up reminders — action-first, max 12 words each

Do NOT repeat lab values in every tip. Put context in summary only; tips must be short imperative actions.
Do not suggest consulting a doctor as a recommendation item.
"""

_HUMAN_PROMPT = """\
Patient health profile:

Risk assessment: {risk_level} risk
Risk explanation: {risk_explanation}

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

Generate personalised recommendations for this patient.
"""


class RecommendationCategories(BaseModel):
    diet: list[str] = Field(
        description="2-3 short action-first nutrition tips (max 12 words each)",
        min_length=1,
        max_length=3,
    )
    exercise: list[str] = Field(
        description="2-3 short action-first activity tips (max 12 words each)",
        min_length=1,
        max_length=3,
    )
    lifestyle: list[str] = Field(
        description="2-3 short action-first habit tips (max 12 words each)",
        min_length=1,
        max_length=3,
    )
    monitoring: list[str] = Field(
        description="1-2 short action-first check-up reminders (max 12 words each)",
        min_length=1,
        max_length=2,
    )


class RecommendationsOutput(BaseModel):
    summary: str = Field(description="One sentence of overall tailored guidance")
    categories: RecommendationCategories


def _build_context(record: PatientRecord) -> dict:
    return {
        "risk_level": record.risk_level or "unknown",
        "risk_explanation": record.risk_explanation or "No explanation available",
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
        "blood_glucose": f"{record.blood_glucose / 18.0:.2f} mmol/L" if record.blood_glucose else "Not recorded",
        "cholesterol": f"{record.cholesterol / 38.67:.2f} mmol/L" if record.cholesterol else "Not recorded",
        "hemoglobin": f"{record.hemoglobin} g/dL" if record.hemoglobin else "Not recorded",
        "creatinine": f"{record.creatinine * 88.42:.1f} μmol/L" if record.creatinine else "Not recorded",
        "ecg_result": record.ecg_result or "Not recorded",
        "symptoms": record.symptoms or "None reported",
        "diagnosis": record.diagnosis or "None",
        "smoking": record.smoking,
        "alcohol": record.alcohol,
        "physical_activity": record.physical_activity,
        "sleep_hours": record.sleep_hours,
        "sound_sleep": "Yes" if record.sound_sleep else "No",
    }


def run_recommendations_chain(record: PatientRecord) -> RecommendationsOutput:
    llm = get_llm()
    structured_llm = llm.with_structured_output(RecommendationsOutput)
    prompt = ChatPromptTemplate.from_messages([
        ("system", _SYSTEM_PROMPT),
        ("human", _HUMAN_PROMPT),
    ])
    chain = prompt | structured_llm
    return chain.invoke(_build_context(record))
