"use client"

import { useState } from "react"
import Link from "next/link"
import { ClipboardPlus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { DoctorPrescriptionList } from "@/features/prescriptions/doctor-prescription-list"
import { useDoctorPatients } from "@/features/doctor/hooks/use-doctor-patients"

export default function DoctorPrescriptionsPage() {
  const { patients, isLoading } = useDoctorPatients()
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const selected = patients.find((p) => p.patient_id === selectedPatientId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50">
          <ClipboardPlus className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Advices &amp; Prescriptions</h1>
          <p className="text-muted-foreground text-sm">Issue and manage prescriptions for your patients</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient selector */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Patients</h2>
          {isLoading && <Spinner />}
          {!isLoading && patients.length === 0 && (
            <p className="text-muted-foreground text-sm">No active patients.</p>
          )}
          <div className="space-y-1">
            {patients.map((p) => (
              <button
                key={p.patient_id}
                onClick={() => setSelectedPatientId(p.patient_id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedPatientId === p.patient_id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                {p.patient_name ?? p.patient_id}
              </button>
            ))}
          </div>
        </div>

        {/* Prescription list + compose button */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedPatientId ? (
            <p className="text-muted-foreground text-sm py-4">Select a patient to view prescriptions.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Prescriptions — {selected?.patient_name ?? selectedPatientId}
                </h2>
                <Link href={`/doctor/prescriptions/${selectedPatientId}/new`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    New Prescription
                  </Button>
                </Link>
              </div>
              <DoctorPrescriptionList patientId={selectedPatientId} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
