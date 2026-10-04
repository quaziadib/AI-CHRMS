"use client"

import { useEffect } from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { DoctorComposeForm } from "./doctor-compose-form"
import { DoctorPrescriptionDetail } from "./doctor-prescription-detail"
import { useDoctorPrescription, useDoctorPrescriptions } from "./usePrescriptions"

export type PanelMode = "view" | "compose"

interface Props {
  patientId: string
  patientName: string
  mode: PanelMode
  onModeChange: (mode: PanelMode) => void
  onClose: () => void
  onDirtyChange: (dirty: boolean) => void
}

/** Right-side prescription panel for the doctor's patient profile. */
export function PrescriptionPanel({ patientId, patientName, mode, onModeChange, onClose, onDirtyChange }: Props) {
  const { data: list, isLoading, mutate } = useDoctorPrescriptions(patientId)
  const latest = list && list.length > 0
    ? [...list].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    : null
  const { data: prescription, isLoading: loadingDetail, mutate: mutateDetail } =
    useDoctorPrescription(patientId, mode === "view" ? latest?.id ?? null : null)

  useEffect(() => {
    if (mode === "view") onDirtyChange(false)
  }, [mode, onDirtyChange])

  return (
    <aside
      aria-label="Prescription panel"
      className="rounded-xl border bg-card shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-card px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{mode === "compose" ? "New prescription" : "Prescription"}</h2>
          <p className="truncate text-xs text-muted-foreground">{patientName}</p>
        </div>
        <div className="flex items-center gap-1">
          {mode === "view" && (
            <Button size="sm" variant="outline" onClick={() => onModeChange("compose")}>
              <Plus className="mr-1 h-3.5 w-3.5" />New
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close prescription panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        {mode === "compose" ? (
          <DoctorComposeForm
            patientId={patientId}
            onDirtyChange={onDirtyChange}
            onCancel={onClose}
            onSaved={() => {
              void mutate()
              onModeChange("view")
            }}
          />
        ) : isLoading || loadingDetail ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : !prescription ? (
          <p className="text-sm text-muted-foreground">No prescription for this patient yet.</p>
        ) : (
          <DoctorPrescriptionDetail
            prescription={prescription}
            patientId={patientId}
            onMutated={() => { void mutate(); void mutateDetail() }}
          />
        )}
      </div>
    </aside>
  )
}
