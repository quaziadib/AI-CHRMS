"use client"

import { use } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"

import { Spinner } from "@/components/ui/spinner"
import { prescriptionsApi } from "@/lib/api"
import type { PrescriptionResponse } from "@/lib/api"
import { DoctorComposeForm } from "@/features/prescriptions/doctor-compose-form"

export default function EditPrescriptionPage({
  params,
}: {
  params: Promise<{ patientId: string; prescriptionId: string }>
}) {
  const { patientId, prescriptionId } = use(params)
  const { data, isLoading, error } = useSWR<PrescriptionResponse>(
    `doctor-prescription-edit-${prescriptionId}`,
    async () => {
      const res = await prescriptionsApi.doctorGet(patientId, prescriptionId)
      if (!res.data) throw new Error(res.error ?? "Not found")
      return res.data
    },
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href={`/doctor/prescriptions/${patientId}/${prescriptionId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold">Edit Prescription</h1>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}
      {error && <p className="text-destructive text-sm">Failed to load prescription.</p>}
      {data && (
        <DoctorComposeForm
          patientId={patientId}
          existingPrescriptionId={prescriptionId}
          currentStatus={data.status}
          defaultValues={{
            symptoms_diagnosis: data.symptoms_diagnosis.map((i) => i.content),
            lab_tests: data.lab_tests.map((i) => i.content),
            general_advice: data.general_advice.map((i) => i.content),
            medications: data.medications.map((m) => ({
              medicine_name: m.medicine_name,
              dosage_morning: m.dosage_morning,
              dosage_afternoon: m.dosage_afternoon,
              dosage_night: m.dosage_night,
              duration_days: m.duration_days,
              instructions: m.instructions ?? "",
            })),
          }}
        />
      )}
    </div>
  )
}
