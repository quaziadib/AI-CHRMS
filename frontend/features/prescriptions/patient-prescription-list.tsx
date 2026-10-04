"use client"

import Link from "next/link"
import { FileText, Stethoscope } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { usePatientPrescriptions } from "./usePrescriptions"
import type { PrescriptionStatus } from "@/lib/api"

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

export function PatientPrescriptionList() {
  const { data, isLoading, error } = usePatientPrescriptions()

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>
  if (error) return <p className="text-destructive text-sm">Failed to load prescriptions.</p>
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Stethoscope className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No prescriptions received yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((p) => (
        <Link key={p.id} href={`/prescriptions/${p.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-3 px-4">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  Dr. {p.doctor_name ?? "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <StatusBadge status={p.status} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
