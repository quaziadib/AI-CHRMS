"use client"

import Link from "next/link"
import { FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useDoctorPrescriptions } from "./usePrescriptions"
import { prescriptionWasEdited } from "./timestamps"
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

export function DoctorPrescriptionList({ patientId }: { patientId: string }) {
  const { data, isLoading, error } = useDoctorPrescriptions(patientId)

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>
  if (error) return <p className="text-destructive text-sm">Failed to load prescriptions.</p>
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground text-sm py-4">No prescriptions issued to this patient yet.</p>
  }

  return (
    <div className="space-y-3">
      {data.map((p) => (
        <Link key={p.id} href={`/doctor/prescriptions/${patientId}/${p.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 py-3 px-4">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {new Date(p.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {prescriptionWasEdited(p.created_at, p.updated_at) && (
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(p.updated_at).toLocaleDateString("en-GB")}
                  </p>
                )}
              </div>
              <StatusBadge status={p.status} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
