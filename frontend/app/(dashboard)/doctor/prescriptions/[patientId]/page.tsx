"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DoctorPrescriptionList } from "@/features/prescriptions/doctor-prescription-list"
import { useDoctorPatients } from "@/features/doctor/hooks/use-doctor-patients"

export default function DoctorPatientPrescriptionsPage({
  params,
}: {
  params: Promise<{ patientId: string }>
}) {
  const { patientId } = use(params)
  const { patients } = useDoctorPatients()
  const patient = patients.find((p) => p.patient_id === patientId)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/doctor/prescriptions" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold flex-1 truncate">
          Prescriptions — {patient?.patient_name ?? "Patient"}
        </h1>
        <Link href={`/doctor/prescriptions/${patientId}/new`}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Prescription
          </Button>
        </Link>
      </div>
      <DoctorPrescriptionList patientId={patientId} />
    </div>
  )
}
