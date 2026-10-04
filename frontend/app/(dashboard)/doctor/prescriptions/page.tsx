"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ClipboardPlus, Plus, Search, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { DoctorPrescriptionList } from "@/features/prescriptions/doctor-prescription-list"
import { useDoctorPatients } from "@/features/doctor/hooks/use-doctor-patients"

const RISK_DOT: Record<string, string> = {
  high: "bg-red-500",
  moderate: "bg-amber-500",
  low: "bg-emerald-500",
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?"
}

export default function DoctorPrescriptionsPage() {
  const { patients, isLoading } = useDoctorPatients()
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  const selected = patients.find((p) => p.patient_id === selectedPatientId)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? patients.filter((p) => (p.patient_name ?? "").toLowerCase().includes(q)) : patients
  }, [patients, query])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Advices &amp; prescriptions</h1>
        <p className="text-sm text-muted-foreground">Pick a patient to review what you have issued or write a new prescription.</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section aria-label="Patients" className="rounded-xl border bg-card">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patients"
                aria-label="Search patients"
                className="pl-9"
              />
            </div>
          </div>
          <div className="max-h-[28rem] overflow-y-auto p-1.5 lg:max-h-[calc(100vh-16rem)]">
            {isLoading ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : patients.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No patients have shared their profile with you yet. Accepted access requests appear here.</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No patient matches &ldquo;{query}&rdquo;.</p>
            ) : (
              <ul className="space-y-0.5">
                {filtered.map((p) => {
                  const active = p.patient_id === selectedPatientId
                  const risk = p.latest_record?.risk_level
                  return (
                    <li key={p.patient_id}>
                      <button
                        type="button"
                        onClick={() => setSelectedPatientId(p.patient_id)}
                        aria-current={active ? "true" : undefined}
                        className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                          active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                        }`}
                      >
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground"}`}>
                          {initials(p.patient_name ?? "")}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">{p.patient_name ?? p.patient_id}</span>
                        {risk && (
                          <span className="flex items-center gap-1.5 text-xs capitalize opacity-80">
                            <span className={`h-2 w-2 rounded-full ${RISK_DOT[risk] ?? "bg-muted-foreground"}`} aria-hidden />
                            {risk}
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

        <section aria-label="Prescriptions" className="min-w-0">
          {!selectedPatientId ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
              <div className="rounded-full bg-muted p-3"><UserRound className="h-6 w-6 text-muted-foreground" /></div>
              <div>
                <p className="font-medium">No patient selected</p>
                <p className="text-sm text-muted-foreground">Choose a patient on the left to see their prescriptions.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2"><ClipboardPlus className="h-5 w-5 text-blue-600" /></div>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{selected?.patient_name ?? "Patient"}</h2>
                    <Link href={`/doctor/patients/${selectedPatientId}`} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                      Open patient profile
                    </Link>
                  </div>
                </div>
                <Link href={`/doctor/prescriptions/${selectedPatientId}/new`}>
                  <Button><Plus className="mr-1.5 h-4 w-4" />New prescription</Button>
                </Link>
              </div>
              <DoctorPrescriptionList patientId={selectedPatientId} />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
