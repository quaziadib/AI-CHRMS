'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Stethoscope, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { RecordDetail } from '@/features/records/components/record-detail'
import { useDoctorPatient } from '@/features/doctor/hooks/use-doctor-patient'
import { formatDate } from '@/lib/utils'

const RISK_BADGE = {
  low: { label: 'Low Risk', icon: CheckCircle, cls: 'text-green-600 bg-green-50' },
  moderate: { label: 'Moderate Risk', icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50' },
  high: { label: 'High Risk', icon: XCircle, cls: 'text-red-600 bg-red-50' },
}

export default function DoctorPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { patient, isLoading, error } = useDoctorPatient(id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !patient) {
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

  const risk = patient.risk_level
    ? RISK_BADGE[patient.risk_level as keyof typeof RISK_BADGE]
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
                <CardTitle>{patient.patient_name ?? patient.pid}</CardTitle>
                <CardDescription>
                  {patient.age} yrs • {patient.gender} • {patient.district} • {formatDate(patient.created_at)}
                </CardDescription>
              </div>
            </div>
            {risk && RiskIcon && (
              <span className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${risk.cls}`}>
                <RiskIcon className="h-4 w-4" />
                {risk.label}
              </span>
            )}
          </div>
        </CardHeader>
        <RecordDetail record={patient} readOnly />
      </Card>
    </div>
  )
}
