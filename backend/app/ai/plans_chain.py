from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.ai.recommendations_chain import _build_context
from app.ai.llm_factory import get_llm
from app.models.record import PatientRecord

_SYSTEM_PROMPT = """\
You are a diabetes nutrition and fitness coach serving patients in Bangladesh. \
Generate a practical 7-day meal plan and weekly exercise routine tailored to the patient's \
health profile, risk level, and district-appropriate foods (rice, lentils, fish, vegetables, roti).

Return structured output with Bangladesh-friendly meals and realistic exercise for their fitness level. \
Reference the patient's actual lab values and risk level. No generic disclaimers.
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

Generate a personalized 7-day meal plan and weekly exercise routine for this patient.
"""


class MealDay(BaseModel):
    day: str = Field(description="Day name e.g. Monday")
    breakfast: str
    lunch: str
    dinner: str
    snack: str = Field(description="Healthy snack suggestion")


class ExerciseDay(BaseModel):
    day: str = Field(description="Day name e.g. Monday")
    activity: str
    duration_minutes: int = Field(ge=10, le=120)
    notes: str = Field(description="Brief safety or intensity note")


class PersonalizedPlanOutput(BaseModel):
    meal_plan_summary: str = Field(description="2-3 sentence overview of the meal plan approach")
    meals: list[MealDay] = Field(min_length=5, max_length=7)
    exercise_summary: str = Field(description="2-3 sentence overview of the exercise approach")
    exercises: list[ExerciseDay] = Field(min_length=5, max_length=7)


def run_personalized_plan_chain(record: PatientRecord) -> PersonalizedPlanOutput:
    # A complete 5–7 day meal and exercise plan exceeds the generic 1,024-token cap.
    llm = get_llm(max_tokens=4096)
    structured_llm = llm.with_structured_output(PersonalizedPlanOutput)
    prompt = ChatPromptTemplate.from_messages([
        ("system", _SYSTEM_PROMPT),
        ("human", _HUMAN_PROMPT),
    ])
    chain = prompt | structured_llm
    return chain.invoke(_build_context(record))
