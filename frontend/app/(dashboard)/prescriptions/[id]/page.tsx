"use client"

import { use } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Spinner } from "@/components/ui/spinner"
import { PatientPrescriptionDetail } from "@/features/prescriptions/patient-prescription-detail"
import { usePatientPrescription } from "@/features/prescriptions/usePrescriptions"

export default function PatientPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data, isLoading, error } = usePatientPrescription(id)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/prescriptions" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold">Prescription</h1>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}
      {error && <p className="text-destructive text-sm">Failed to load prescription.</p>}
      {data && <PatientPrescriptionDetail prescription={data} />}
    </div>
  )
}
