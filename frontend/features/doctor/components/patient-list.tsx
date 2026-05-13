'use client'

import Link from 'next/link'
import { Users, CheckCircle, AlertTriangle, XCircle, ChevronRight, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { PatientRecord } from '@/lib/api'

const RISK_BADGE = {
  low: { label: 'Low', icon: CheckCircle, cls: 'text-green-600 bg-green-50' },
  moderate: { label: 'Moderate', icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50' },
  high: { label: 'High', icon: XCircle, cls: 'text-red-600 bg-red-50' },
}

interface Props {
  patients: PatientRecord[]
  isLoading: boolean
}

export function PatientList({ patients, isLoading }: Props) {
  if (isLoading) return null

  if (patients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="font-medium">No patients assigned</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ask an administrator to assign patients to your account.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {patients.map((record) => {
        const risk = record.risk_level
          ? RISK_BADGE[record.risk_level as keyof typeof RISK_BADGE]
          : null
        const RiskIcon = risk?.icon

        return (
          <Link key={record.id} href={`/doctor/patients/${record.id}`}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {(record.patient_name ?? 'P').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{record.patient_name ?? record.pid}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span>{record.age} yrs, {record.gender}</span>
                        <span>•</span>
                        <span>{record.district}</span>
                        {record.hemoglobin != null && (
                          <>
                            <span>•</span>
                            <span>HbA1c {record.hemoglobin} g/dL</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {risk && RiskIcon && (
                      <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${risk.cls}`}>
                        <RiskIcon className="h-3 w-3" />
                        {risk.label}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(record.created_at)}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
