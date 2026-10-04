"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Edit2, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { prescriptionsApi } from "@/lib/api"
import type { PrescriptionResponse, PrescriptionStatus } from "@/lib/api"
import { PrescriptionSections } from "./prescription-sections"
import { prescriptionWasEdited } from "./timestamps"

function StatusBadge({ status }: { status: PrescriptionStatus }) {
  const styles: Record<PrescriptionStatus, string> = {
    draft: "bg-orange-100 text-orange-700",
    published: "bg-green-100 text-green-700",
    revoked: "bg-red-100 text-red-700",
  }
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export function DoctorPrescriptionDetail({
  prescription,
  patientId,
  onMutated,
}: {
  prescription: PrescriptionResponse
  patientId: string
  onMutated: () => void
}) {
  const router = useRouter()
  const [revoking, setRevoking] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)

  async function handleRevoke() {
    setRevoking(true)
    const res = await prescriptionsApi.doctorUpdate(patientId, prescription.id, { status: "revoked" })
    setRevoking(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success("Prescription revoked")
    setConfirmRevoke(false)
    onMutated()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            Issued {new Date(prescription.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            {prescriptionWasEdited(prescription.created_at, prescription.updated_at) && (
              <> &mdash; Updated {new Date(prescription.updated_at).toLocaleDateString("en-GB")}</>
            )}
          </p>
        </div>
        <StatusBadge status={prescription.status} />
        {prescription.status !== "revoked" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/doctor/prescriptions/${patientId}/${prescription.id}/edit`)}
          >
            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
        )}
        {prescription.status === "published" && !confirmRevoke && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive hover:bg-destructive/10"
            onClick={() => setConfirmRevoke(true)}
          >
            Revoke
          </Button>
        )}
      </div>

      {confirmRevoke && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm flex-1">Revoke this prescription? The patient will see a revocation notice.</p>
            <Button
              variant="destructive"
              size="sm"
              disabled={revoking}
              onClick={handleRevoke}
            >
              {revoking ? <Spinner className="h-4 w-4" /> : "Confirm Revoke"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmRevoke(false)}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      <PrescriptionSections prescription={prescription} />
    </div>
  )
}
