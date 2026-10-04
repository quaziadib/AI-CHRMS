"use client"

import { use } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import useSWR from "swr"

import { Spinner } from "@/components/ui/spinner"
import { prescriptionsApi } from "@/lib/api"
import type { PrescriptionResponse } from "@/lib/api"
import { DoctorPrescriptionDetail } from "@/features/prescriptions/doctor-prescription-detail"

export default function DoctorPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ patientId: string; prescriptionId: string }>
}) {
  const { patientId, prescriptionId } = use(params)
  const { data, isLoading, error, mutate } = useSWR<PrescriptionResponse>(
    `doctor-prescription-${prescriptionId}`,
    async () => {
      const res = await prescriptionsApi.doctorGet(patientId, prescriptionId)
      if (!res.data) throw new Error(res.error ?? "Not found")
      return res.data
    },
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link href={`/doctor/prescriptions/${patientId}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold">Prescription</h1>
      </div>
      {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}
      {error && <p className="text-destructive text-sm">Failed to load prescription.</p>}
      {data && (
        <DoctorPrescriptionDetail
          prescription={data}
          patientId={patientId}
          onMutated={() => mutate()}
        />
      )}
    </div>
  )
}
