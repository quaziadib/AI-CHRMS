'use client'

import { CheckCircle, AlertTriangle, XCircle, Salad, Dumbbell, Moon, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PatientRecord, RecommendationsOutput } from '@/lib/api'

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

const CATEGORY_CONFIG = [
  { key: 'diet' as const, label: 'Diet', icon: Salad },
  { key: 'exercise' as const, label: 'Exercise', icon: Dumbbell },
  { key: 'lifestyle' as const, label: 'Lifestyle', icon: Moon },
  { key: 'monitoring' as const, label: 'Monitoring', icon: Activity },
]

function isStructuredRecs(recs: unknown): recs is RecommendationsOutput {
  return typeof recs === 'object' && recs !== null && !Array.isArray(recs) && 'categories' in recs
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
  const recs = record.recommendations

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
      <CardContent className="space-y-4">
        {record.risk_explanation && (
          <p className="text-sm leading-relaxed">{record.risk_explanation}</p>
        )}

        {recs && isStructuredRecs(recs) ? (
          <div className="space-y-3">
            {recs.summary && (
              <p className="text-xs text-muted-foreground italic">{recs.summary}</p>
            )}
            {CATEGORY_CONFIG.map(({ key, label, icon: CatIcon }) => {
              const items = recs.categories[key]
              if (!items?.length) return null
              return (
                <div key={key}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <CatIcon className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {label}
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-background/60 text-foreground flex items-center justify-center text-xs font-medium border">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        ) : Array.isArray(recs) && recs.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Recommendations
            </p>
            <ul className="space-y-1">
              {(recs as string[]).map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-background/60 text-foreground flex items-center justify-center text-xs font-medium border">
                    {i + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
