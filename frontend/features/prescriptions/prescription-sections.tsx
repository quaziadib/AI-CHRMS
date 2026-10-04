"use client"

import type { PrescriptionResponse } from "@/lib/api"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-primary border-b border-primary/20 pb-1">{title}</h4>
      {children}
    </div>
  )
}

export function PrescriptionSections({ prescription }: { prescription: PrescriptionResponse }) {
  const hasSymptoms = prescription.symptoms_diagnosis.length > 0
  const hasMeds = prescription.medications.length > 0
  const hasLab = prescription.lab_tests.length > 0
  const hasAdvice = prescription.general_advice.length > 0

  if (!hasSymptoms && !hasMeds && !hasLab && !hasAdvice) {
    return <p className="text-muted-foreground text-sm">No clinical content recorded.</p>
  }

  return (
    <div className="space-y-5">
      {hasSymptoms && (
        <Section title="1. Symptoms & Diagnosis">
          <ul className="list-disc list-inside space-y-1 text-sm">
            {prescription.symptoms_diagnosis.map((item) => (
              <li key={item.id}>{item.content}</li>
            ))}
          </ul>
        </Section>
      )}

      {hasMeds && (
        <Section title="2. Medications">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-1 pr-4">Medicine</th>
                  <th className="pb-1 pr-4">Dosage (M+A+N)</th>
                  <th className="pb-1 pr-4">Duration</th>
                  <th className="pb-1">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {prescription.medications.map((med) => (
                  <tr key={med.id} className="border-b last:border-0">
                    <td className="py-1.5 pr-4 font-medium">{med.medicine_name}</td>
                    <td className="py-1.5 pr-4 font-mono text-xs">
                      {med.dosage_morning}+{med.dosage_afternoon}+{med.dosage_night}
                    </td>
                    <td className="py-1.5 pr-4 whitespace-nowrap">{med.duration_days} day{med.duration_days !== 1 ? "s" : ""}</td>
                    <td className="py-1.5 text-muted-foreground">{med.instructions || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-muted-foreground mt-1">M = Morning · A = Afternoon · N = Night</p>
          </div>
        </Section>
      )}

      {hasLab && (
        <Section title="3. Lab Tests">
          <ul className="list-disc list-inside space-y-1 text-sm">
            {prescription.lab_tests.map((item) => (
              <li key={item.id}>{item.content}</li>
            ))}
          </ul>
        </Section>
      )}

      {hasAdvice && (
        <Section title="4. General Advice">
          <ul className="list-disc list-inside space-y-1 text-sm">
            {prescription.general_advice.map((item) => (
              <li key={item.id}>{item.content}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}
