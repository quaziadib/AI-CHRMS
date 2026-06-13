'use client'

import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HealthAssessmentReport } from '@/features/records/components/health-assessment-report'
import type { PatientRecord } from '@/lib/api'

interface RiskResultProps {
  record: PatientRecord
  onContinue: () => void
}

export function RiskResult({ record, onContinue }: RiskResultProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Health Assessment</h1>
        <p className="text-muted-foreground">AI summary of your risk and next steps</p>
      </div>

      <HealthAssessmentReport record={record} showTitle={false} />

      <div className="flex justify-end">
        <Button onClick={onContinue} className="gap-2">
          View My Records
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
