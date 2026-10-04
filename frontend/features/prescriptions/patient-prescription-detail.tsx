"use client"

import { useState } from "react"
import { Download, AlertTriangle, Stethoscope } from "lucide-react"
import { toast } from "sonner"

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

export function PatientPrescriptionDetail({ prescription }: { prescription: PrescriptionResponse }) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      await prescriptionsApi.patientDownloadPdf(prescription.id)
    } catch {
      toast.error("Failed to download PDF")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header card */}
      <Card>
        <CardContent className="py-4 px-5 space-y-3">
          {prescription.status === "revoked" && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                This prescription has been revoked by the issuing physician. It is retained for your records only and should not be acted upon.
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">Dr. {prescription.doctor_name ?? "Physician"}</p>
                <p className="text-xs text-muted-foreground">
                  Issued{" "}
                  {new Date(prescription.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {prescriptionWasEdited(prescription.created_at, prescription.updated_at) && (
                    <> &mdash; Updated {new Date(prescription.updated_at).toLocaleDateString("en-GB")}</>
                  )}
                </p>
              </div>
            </div>
            <StatusBadge status={prescription.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Spinner className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-1.5" />
              )}
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <PrescriptionSections prescription={prescription} />
    </div>
  )
}
