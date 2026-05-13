'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Stethoscope, CheckCircle, AlertTriangle, XCircle, FileText, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { RecordDetail } from '@/features/records/components/record-detail'
import { useDoctorPatient } from '@/features/doctor/hooks/use-doctor-patient'
import { doctorApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { PatientRecord } from '@/lib/api'

const RISK_BADGE = {
  low: { label: 'Low Risk', icon: CheckCircle, cls: 'text-green-600 bg-green-50' },
  moderate: { label: 'Moderate Risk', icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50' },
  high: { label: 'High Risk', icon: XCircle, cls: 'text-red-600 bg-red-50' },
}

export default function DoctorPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { patient: initialPatient, isLoading, error } = useDoctorPatient(id)
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)

  const record = patient ?? initialPatient

  const handleSummarize = async () => {
    setIsSummarizing(true)
    const { data, error: err } = await doctorApi.summarize(id)
    setIsSummarizing(false)
    if (data) {
      setPatient(data)
      toast.success('Clinical summary generated')
    } else {
      toast.error(err ?? 'Failed to generate summary')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="space-y-4">
        <Link href="/doctor">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to patients
          </Button>
        </Link>
        <p className="text-muted-foreground">Patient record not found.</p>
      </div>
    )
  }

  const risk = record.risk_level
    ? RISK_BADGE[record.risk_level as keyof typeof RISK_BADGE]
    : null
  const RiskIcon = risk?.icon

  return (
    <div className="space-y-4">
      <Link href="/doctor">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to patients
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Stethoscope className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>{record.patient_name ?? record.pid}</CardTitle>
                <CardDescription>
                  {record.age} yrs • {record.gender} • {record.district} • {formatDate(record.created_at)}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {risk && RiskIcon && (
                <span className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${risk.cls}`}>
                  <RiskIcon className="h-4 w-4" />
                  {risk.label}
                </span>
              )}
              <Button
                variant={record.ehr_summary ? 'outline' : 'default'}
                size="sm"
                onClick={handleSummarize}
                disabled={isSummarizing}
              >
                {isSummarizing ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Generating…
                  </>
                ) : record.ehr_summary ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Summary
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Summary
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {record.ehr_summary && (
          <CardContent className="pt-0">
            <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Clinical Summary
                </p>
                {record.ehr_summary_at && (
                  <p className="text-xs text-muted-foreground">
                    Generated {formatDate(record.ehr_summary_at)}
                  </p>
                )}
              </div>
              <p className="text-sm leading-relaxed">{record.ehr_summary}</p>
            </div>
          </CardContent>
        )}

        <RecordDetail record={record} readOnly />
      </Card>
    </div>
  )
}
