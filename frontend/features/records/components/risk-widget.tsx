'use client'

import { HealthAssessmentReport } from '@/features/records/components/health-assessment-report'
import type { PatientRecord } from '@/lib/api'

interface RiskWidgetProps {
  record: PatientRecord
}

/** Compact wrapper — use HealthAssessmentReport directly for full layout. */
export function RiskWidget({ record }: RiskWidgetProps) {
  return <HealthAssessmentReport record={record} compact showTitle />
}
