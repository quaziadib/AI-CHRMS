'use client'

import { CardContent } from '@/components/ui/card'
import {
  VitalSignsSection,
  MedicalHistorySection,
  LifestyleSection,
  LabResultsSection,
  ClinicalNotesSection,
} from '@/components/ui/record-sections'
import type { PatientRecord } from '@/lib/api'

interface Props {
  record: PatientRecord
}

export function RecordDetail({ record }: Props) {
  return (
    <CardContent className="border-t bg-muted/20 pt-4">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        <VitalSignsSection record={record} />
        <MedicalHistorySection record={record} />
        <LifestyleSection record={record} />
        <LabResultsSection record={record} />
        <ClinicalNotesSection record={record} />
      </div>
    </CardContent>
  )
}
