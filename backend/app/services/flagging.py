from app.models.record import PatientRecord


def _flag(field: str, label: str, value: float, unit: str, severity: str, reference: str) -> dict:
    return {"field": field, "label": label, "value": value, "unit": unit,
            "severity": severity, "reference": reference}


def compute_flags(record: PatientRecord) -> list[dict]:
    flags: list[dict] = []

    # Blood glucose (fasting, mg/dL)
    if record.blood_glucose is not None:
        if record.blood_glucose >= 126:
            flags.append(_flag("blood_glucose", "Diabetic range",
                               record.blood_glucose, "mg/dL", "critical",
                               "Fasting glucose ≥ 126 mg/dL"))
        elif record.blood_glucose >= 100:
            flags.append(_flag("blood_glucose", "Pre-diabetic range",
                               record.blood_glucose, "mg/dL", "warning",
                               "Fasting glucose 100–125 mg/dL"))

    # Blood pressure (mmHg)
    if record.bp_systolic >= 140 or record.bp_diastolic >= 90:
        flags.append(_flag("blood_pressure",
                           "Hypertension Stage 2",
                           record.bp_systolic, "mmHg", "critical",
                           "BP ≥ 140/90 mmHg"))
    elif record.bp_systolic >= 130 or record.bp_diastolic >= 80:
        flags.append(_flag("blood_pressure",
                           "Hypertension Stage 1",
                           record.bp_systolic, "mmHg", "warning",
                           "BP ≥ 130/80 mmHg"))

    # BMI (kg/m²)
    if record.bmi >= 30:
        flags.append(_flag("bmi", "Obese", record.bmi, "kg/m²", "critical", "BMI ≥ 30 kg/m²"))
    elif record.bmi >= 25:
        flags.append(_flag("bmi", "Overweight", record.bmi, "kg/m²", "warning", "BMI 25–29.9 kg/m²"))
    elif record.bmi < 18.5:
        flags.append(_flag("bmi", "Underweight", record.bmi, "kg/m²", "warning", "BMI < 18.5 kg/m²"))

    # Cholesterol (mg/dL)
    if record.cholesterol is not None:
        if record.cholesterol >= 240:
            flags.append(_flag("cholesterol", "High cholesterol",
                               record.cholesterol, "mg/dL", "critical",
                               "Total cholesterol ≥ 240 mg/dL"))
        elif record.cholesterol >= 200:
            flags.append(_flag("cholesterol", "Borderline high cholesterol",
                               record.cholesterol, "mg/dL", "warning",
                               "Total cholesterol 200–239 mg/dL"))

    # Hemoglobin (g/dL) — gender-adjusted
    if record.hemoglobin is not None:
        threshold = 12.0 if (record.gender or "").lower() == "female" else 13.5
        if record.hemoglobin < threshold:
            flags.append(_flag("hemoglobin",
                               f"Low hemoglobin — anemia",
                               record.hemoglobin, "g/dL", "warning",
                               f"Hemoglobin < {threshold} g/dL"))

    # Creatinine (mg/dL)
    if record.creatinine is not None and record.creatinine > 1.2:
        flags.append(_flag("creatinine", "Elevated creatinine",
                           record.creatinine, "mg/dL", "warning",
                           "Creatinine > 1.2 mg/dL"))

    # Pulse rate (bpm)
    if record.pulse_rate > 100:
        flags.append(_flag("pulse_rate", "Tachycardia",
                           float(record.pulse_rate), "bpm", "warning",
                           "Pulse > 100 bpm"))
    elif record.pulse_rate < 60:
        flags.append(_flag("pulse_rate", "Bradycardia",
                           float(record.pulse_rate), "bpm", "warning",
                           "Pulse < 60 bpm"))

    return flags
