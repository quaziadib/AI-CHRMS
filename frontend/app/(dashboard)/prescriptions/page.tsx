"use client"

import { ClipboardPlus } from "lucide-react"
import { PatientPrescriptionList } from "@/features/prescriptions/patient-prescription-list"

export default function PatientPrescriptionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50">
          <ClipboardPlus className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Advices &amp; Prescriptions</h1>
          <p className="text-muted-foreground text-sm">Prescriptions issued by your doctors</p>
        </div>
      </div>
      <PatientPrescriptionList />
    </div>
  )
}
