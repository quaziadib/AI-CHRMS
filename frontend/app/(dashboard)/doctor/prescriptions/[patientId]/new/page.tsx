"use client"

import { use } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { DoctorComposeForm } from "@/features/prescriptions/doctor-compose-form"

export default function NewPrescriptionPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link href={`/doctor/prescriptions/${patientId}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold">New Prescription</h1>
      </div>
      <DoctorComposeForm patientId={patientId} />
    </div>
  )
}
