from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.ai.llm_factory import get_llm
from app.models.record import PatientRecord

_SYSTEM_PROMPT = """\
You are a clinical EHR assistant. Given a patient's full health profile, write a concise clinical \
briefing (1-2 paragraphs, around 150 words) as if handing over to a consulting doctor before a visit.

Rules:
- Plain prose only — no markdown, no bullet points, no headers, no asterisks
- Cover: key demographics, significant medical and family history, current vitals, notable lab values, \
risk level and contributing factors, lifestyle factors
- Conclude with the top 1-2 clinical concerns for this patient
- Clinical tone (doctor-to-doctor) — not patient-facing language
- Reference actual values from the data (e.g. "fasting glucose of 7.2 mmol/L")
"""

_HUMAN_PROMPT = """\
Patient health profile:

Demographics: {age} year old {gender} from {district}
Family history: Diabetes={family_diabetes}, Hypertension={family_hypertension}, CVD={family_cvd}, Stroke={family_stroke}
Medical history: Diabetes={diabetes_history}, Hypertension={hypertension}, CVD={cvd}, Stroke={stroke}
Allergies: {allergies} | Pregnancies: {pregnancies}

Vital signs: BP {bp_systolic}/{bp_diastolic} mmHg, BMI {bmi}, Pulse {pulse_rate} bpm
Lab results: Blood glucose={blood_glucose}, Cholesterol={cholesterol}, Hemoglobin={hemoglobin}, Creatinine={creatinine}, ECG={ecg_result}

Symptoms: {symptoms}
Diagnosis notes: {diagnosis}

Lifestyle: Smoking={smoking}, Alcohol={alcohol}, Physical activity={physical_activity}, Sleep={sleep_hours}h (sound: {sound_sleep})

Risk assessment: {risk_level} — {risk_explanation}

Generate the clinical briefing.
"""


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
        "allergies": record.allergies or "None",
        "pregnancies": record.pregnancies if record.pregnancies is not None else "N/A",
        "bp_systolic": record.bp_systolic,
        "bp_diastolic": record.bp_diastolic,
        "bmi": f"{record.bmi:.1f}",
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
        "risk_level": record.risk_level or "Not yet assessed",
        "risk_explanation": record.risk_explanation or "N/A",
    }


def run_ehr_summary_chain(record: PatientRecord) -> str:
    prompt = ChatPromptTemplate.from_messages([
        ("system", _SYSTEM_PROMPT),
        ("human", _HUMAN_PROMPT),
    ])
    chain = prompt | get_llm() | StrOutputParser()
    return chain.invoke(_build_context(record))
