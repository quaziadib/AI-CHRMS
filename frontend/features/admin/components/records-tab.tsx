'use client'

import { useState } from 'react'
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Calendar,
  User as UserIcon,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  VitalSignsSection,
  MedicalHistorySection,
  FamilyHistorySection,
  LifestyleSection,
  LabResultsSection,
  ClinicalNotesSection,
} from '@/components/ui/record-sections'
import { formatDate } from '@/lib/utils'
import type { PatientRecord, User } from '@/lib/api'

interface Props {
  records: PatientRecord[]
  users: User[]
  isLoading: boolean
  searchQuery: string
}

export function RecordsTab({ records, users, isLoading, searchQuery }: Props) {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)

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
                    <CardTitle className="text-base font-mono">{record.pid}</CardTitle>
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
                  <VitalSignsSection record={record} showBMICategory={false} />
                  <MedicalHistorySection record={record} />
                  <FamilyHistorySection record={record} />
                  <LifestyleSection record={record} />
                  <LabResultsSection record={record} />
                  <ClinicalNotesSection record={record} />
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
