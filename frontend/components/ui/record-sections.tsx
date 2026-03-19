import { getBMICategory } from '@/lib/utils'
import type { PatientRecord } from '@/lib/api'

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt>{label}:</dt>
      <dd>{value}</dd>
    </div>
  )
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="font-medium text-muted-foreground mb-2">{title}</h4>
      <dl className="space-y-1">{children}</dl>
    </section>
  )
}

export function VitalSignsSection({ record, showBMICategory = true }: { record: PatientRecord; showBMICategory?: boolean }) {
  return (
    <SectionBlock title="Vital Signs">
      <DataRow label="BP" value={`${record.bp_systolic}/${record.bp_diastolic} mmHg`} />
      <DataRow label="BMI" value={showBMICategory ? `${record.bmi} (${getBMICategory(record.bmi)})` : record.bmi} />
      <DataRow label="Pulse" value={`${record.pulse_rate} bpm`} />
      <DataRow label="Height" value={`${record.height} cm`} />
      <DataRow label="Weight" value={`${record.weight} kg`} />
    </SectionBlock>
  )
}

export function MedicalHistorySection({ record }: { record: PatientRecord }) {
  return (
    <SectionBlock title="Medical History">
      <DataRow label="Diabetes" value={record.diabetes_history ? 'Yes' : 'No'} />
      <DataRow label="Hypertension" value={record.hypertension ? 'Yes' : 'No'} />
      <DataRow label="CVD" value={record.cvd ? 'Yes' : 'No'} />
      <DataRow label="Stroke" value={record.stroke ? 'Yes' : 'No'} />
      {record.allergies && <DataRow label="Allergies" value={record.allergies} />}
    </SectionBlock>
  )
}

export function FamilyHistorySection({ record }: { record: PatientRecord }) {
  return (
    <SectionBlock title="Family History">
      <DataRow label="Diabetes" value={record.family_diabetes ? 'Yes' : 'No'} />
      <DataRow label="Hypertension" value={record.family_hypertension ? 'Yes' : 'No'} />
      <DataRow label="CVD" value={record.family_cvd ? 'Yes' : 'No'} />
      <DataRow label="Stroke" value={record.family_stroke ? 'Yes' : 'No'} />
    </SectionBlock>
  )
}

export function LifestyleSection({ record }: { record: PatientRecord }) {
  return (
    <SectionBlock title="Lifestyle">
      <DataRow label="Smoking" value={record.smoking} />
      {record.physical_activity && (
        <div className="flex justify-between">
          <dt>Activity:</dt>
          <dd className="text-right max-w-[140px] truncate">{record.physical_activity}</dd>
        </div>
      )}
      <DataRow label="Alcohol" value={record.alcohol} />
      <DataRow label="Sleep" value={`${record.sleep_hours} hrs`} />
    </SectionBlock>
  )
}

export function LabResultsSection({ record }: { record: PatientRecord }) {
  if (!record.blood_glucose && !record.cholesterol && !record.hemoglobin && !record.creatinine && !record.ecg_result) {
    return null
  }
  return (
    <SectionBlock title="Lab Results">
      {record.blood_glucose && <DataRow label="Blood Glucose" value={`${record.blood_glucose} mg/dL`} />}
      {record.cholesterol && <DataRow label="Cholesterol" value={`${record.cholesterol} mg/dL`} />}
      {record.hemoglobin && <DataRow label="Hemoglobin" value={`${record.hemoglobin} g/dL`} />}
      {record.creatinine && <DataRow label="Creatinine" value={`${record.creatinine} mg/dL`} />}
      {record.ecg_result && <DataRow label="ECG" value={record.ecg_result} />}
    </SectionBlock>
  )
}

export function ClinicalNotesSection({ record }: { record: PatientRecord }) {
  if (!record.symptoms && !record.diagnosis) return null
  return (
    <section className="sm:col-span-2">
      <h4 className="font-medium text-muted-foreground mb-2">Clinical Notes</h4>
      {record.symptoms && <p><span className="text-muted-foreground">Symptoms: </span>{record.symptoms}</p>}
      {record.diagnosis && <p className="mt-1"><span className="text-muted-foreground">Diagnosis: </span>{record.diagnosis}</p>}
    </section>
  )
}
