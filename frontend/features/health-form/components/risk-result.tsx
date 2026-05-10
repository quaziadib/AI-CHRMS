'use client'

import { CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PatientRecord } from '@/lib/api'

const RISK_CONFIG = {
  low: {
    label: 'Low Risk',
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-800',
  },
  moderate: {
    label: 'Moderate Risk',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
  },
  high: {
    label: 'High Risk',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800',
  },
}

interface RiskResultProps {
  record: PatientRecord
  onContinue: () => void
}

export function RiskResult({ record, onContinue }: RiskResultProps) {
  const level = record.risk_level as keyof typeof RISK_CONFIG | undefined
  const config = level ? RISK_CONFIG[level] : null
  const Icon = config?.icon

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Risk Assessment</h1>
        <p className="text-muted-foreground">AI-powered analysis of your health data</p>
      </div>

      {config && Icon && (
        <Card className={`border-2 ${config.bg}`}>
          <CardHeader className="pb-3">
            <CardTitle className={`flex items-center gap-3 ${config.color}`}>
              <Icon className="h-7 w-7" />
              <span className="text-2xl">{config.label}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {record.risk_explanation && (
              <p className="text-sm leading-relaxed text-foreground">
                {record.risk_explanation}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {record.recommendations && record.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Personalised Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {record.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={onContinue} className="gap-2">
          View My Records
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
