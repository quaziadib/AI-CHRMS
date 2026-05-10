'use client'

import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PatientRecord } from '@/lib/api'

const RISK_CONFIG = {
  low: {
    label: 'Low Risk',
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
  },
  moderate: {
    label: 'Moderate Risk',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
  },
  high: {
    label: 'High Risk',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
  },
}

interface RiskWidgetProps {
  record: PatientRecord
}

export function RiskWidget({ record }: RiskWidgetProps) {
  if (!record.risk_level) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No risk assessment yet. Submit your health form to generate one.
        </CardContent>
      </Card>
    )
  }

  const level = record.risk_level as keyof typeof RISK_CONFIG
  const config = RISK_CONFIG[level]
  const Icon = config.icon

  const scoredAt = record.risk_scored_at
    ? new Date(record.risk_scored_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <Card className={`border-2 ${config.bg}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 text-base ${config.color}`}>
            <Icon className="h-5 w-5" />
            {config.label}
          </CardTitle>
          {scoredAt && (
            <span className="text-xs text-muted-foreground">Assessed {scoredAt}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {record.risk_explanation && (
          <p className="text-sm leading-relaxed">{record.risk_explanation}</p>
        )}
        {record.recommendations && record.recommendations.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Recommendations
            </p>
            <ul className="space-y-1">
              {record.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-background/60 text-foreground flex items-center justify-center text-xs font-medium border">
                    {i + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
