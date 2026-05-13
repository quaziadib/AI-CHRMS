'use client'

import { useState } from 'react'
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  User as UserIcon,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Stethoscope,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  VitalSignsSection,
  MedicalHistorySection,
  FamilyHistorySection,
  LifestyleSection,
  LabResultsSection,
  ClinicalNotesSection,
} from '@/components/ui/record-sections'
import { formatDate } from '@/lib/utils'
import type { PatientRecord, User, RecommendationsOutput } from '@/lib/api'

function isStructuredRecs(recs: unknown): recs is RecommendationsOutput {
  return typeof recs === 'object' && recs !== null && !Array.isArray(recs) && 'categories' in recs
}

interface Props {
  records: PatientRecord[]
  users: User[]
  doctors: User[]
  isLoading: boolean
  searchQuery: string
  onAssignDoctor: (recordId: string, doctorId: string | null) => void
}

export function RecordsTab({ records, users, doctors, isLoading, searchQuery, onAssignDoctor }: Props) {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)

  const RISK_BADGE = {
    low: { label: 'Low Risk', icon: CheckCircle, cls: 'text-green-600 bg-green-50' },
    moderate: { label: 'Moderate Risk', icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50' },
    high: { label: 'High Risk', icon: XCircle, cls: 'text-red-600 bg-red-50' },
  }

  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true
    const recordUser = users.find(u => u.id === r.user_id)
    return (
      r.pid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recordUser?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recordUser?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  if (isLoading) return null

  if (filteredRecords.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No records found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {filteredRecords.map((record) => {
        const recordUser = users.find(u => u.id === record.user_id)
        return (
          <Card key={record.id} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors py-4"
              onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base font-mono">{record.pid}</CardTitle>
                      {record.risk_level && RISK_BADGE[record.risk_level as keyof typeof RISK_BADGE] && (() => {
                        const badge = RISK_BADGE[record.risk_level as keyof typeof RISK_BADGE]
                        const BadgeIcon = badge.icon
                        return (
                          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                            <BadgeIcon className="h-3 w-3" />
                            {badge.label}
                          </span>
                        )
                      })()}
                    </div>
                    <CardDescription className="flex items-center gap-2 flex-wrap">
                      <UserIcon className="h-3 w-3" />
                      {recordUser?.full_name ?? 'Unknown User'}
                      <span>•</span>
                      {record.age} yrs, {record.gender}, {record.district}
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      {formatDate(record.created_at)}
                    </CardDescription>
                  </div>
                </div>
                {expandedRecord === record.id
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </CardHeader>

            {expandedRecord === record.id && (
              <CardContent className="border-t bg-muted/20 pt-4">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                  <section>
                    <h4 className="font-medium text-muted-foreground mb-2">Submitted by</h4>
                    <p>{recordUser?.full_name}</p>
                    <p className="text-muted-foreground">{recordUser?.email}</p>
                  </section>

                  <section>
                    <h4 className="font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5" />
                      Assigned Doctor
                    </h4>
                    <Select
                      value={record.doctor_id ?? 'unassigned'}
                      onValueChange={(val) => onAssignDoctor(record.id, val === 'unassigned' ? null : val)}
                    >
                      <SelectTrigger className="w-48" onClick={(e) => e.stopPropagation()}>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {doctors.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </section>

                  <VitalSignsSection record={record} showBMICategory={false} />
                  <MedicalHistorySection record={record} />
                  <FamilyHistorySection record={record} />
                  <LifestyleSection record={record} />
                  <LabResultsSection record={record} />
                  <ClinicalNotesSection record={record} />
                  {record.recommendations && isStructuredRecs(record.recommendations) && (
                    <section className="sm:col-span-2 lg:col-span-3">
                      <h4 className="font-medium text-muted-foreground mb-1">AI Recommendations</h4>
                      <p className="text-sm text-muted-foreground italic">
                        {record.recommendations.summary}
                      </p>
                    </section>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
