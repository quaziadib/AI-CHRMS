"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, FileText } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { useDoctorPrescriptions } from "./usePrescriptions"
import { prescriptionWasEdited } from "./timestamps"
import type { PrescriptionStatus } from "@/lib/api"

type Filter = "all" | PrescriptionStatus

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
  { value: "revoked", label: "Revoked" },
]

function StatusBadge({ status }: { status: PrescriptionStatus }) {
  const styles: Record<PrescriptionStatus, string> = {
    draft: "bg-orange-100 text-orange-700",
    published: "bg-green-100 text-green-700",
    revoked: "bg-red-100 text-red-700",
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

export function DoctorPrescriptionList({ patientId }: { patientId: string }) {
  const { data, isLoading, error, mutate } = useDoctorPrescriptions(patientId)
  const [filter, setFilter] = useState<Filter>("all")

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>
  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p className="font-medium text-destructive">Could not load prescriptions.</p>
        <button type="button" onClick={() => mutate()} className="mt-1 underline underline-offset-4">Try again</button>
      </div>
    )
  }
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-14 text-center">
        <p className="font-medium">No prescriptions yet</p>
        <p className="text-sm text-muted-foreground">Use &ldquo;New prescription&rdquo; to write the first one for this patient.</p>
      </div>
    )
  }

  const sorted = [...data].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const rows = filter === "all" ? sorted : sorted.filter((p) => p.status === filter)
  const count = (f: Filter) => (f === "all" ? data.length : data.filter((p) => p.status === f).length)

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full border px-3 py-1 text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              filter === f.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {f.label} <span className="opacity-70">{count(f.value)}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No {filter} prescriptions for this patient.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {rows.map((p) => (
            <li key={p.id}>
              <Link
                href={`/doctor/prescriptions/${patientId}/${p.id}`}
                className="flex items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50"
              >
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{fmt(p.created_at)}</p>
                  {prescriptionWasEdited(p.created_at, p.updated_at) && (
                    <p className="text-xs text-muted-foreground">Updated {new Date(p.updated_at).toLocaleDateString("en-GB")}</p>
                  )}
                </div>
                <StatusBadge status={p.status} />
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
