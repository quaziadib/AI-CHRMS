'use client'

import { useState } from 'react'
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Salad,
  Dumbbell,
  Moon,
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { PatientRecord } from '@/lib/api'
import {
  RISK_META,
  type RiskLevel,
  isStructuredRecs,
  essence,
  summarizeTip,
  summaryLine,
  getVitalHighlights,
  TONE_STYLES,
} from '@/lib/assessment-utils'

const RISK_ICONS = { low: CheckCircle, moderate: AlertTriangle, high: XCircle }

const RISK_BAR_CLASS = {
  low: '[&_[data-slot=progress-indicator]]:bg-green-500',
  moderate: '[&_[data-slot=progress-indicator]]:bg-amber-500',
  high: '[&_[data-slot=progress-indicator]]:bg-red-500',
} as const

const CATEGORY_CONFIG = [
  { key: 'diet' as const, label: 'Eat', icon: Salad, accent: 'text-green-600 bg-green-50' },
  { key: 'exercise' as const, label: 'Move', icon: Dumbbell, accent: 'text-blue-600 bg-blue-50' },
  { key: 'lifestyle' as const, label: 'Habits', icon: Moon, accent: 'text-purple-600 bg-purple-50' },
  { key: 'monitoring' as const, label: 'Track', icon: Activity, accent: 'text-orange-600 bg-orange-50' },
]

interface HealthAssessmentReportProps {
  record: PatientRecord
  compact?: boolean
  showTitle?: boolean
}

export function HealthAssessmentReport({
  record,
  compact = false,
  showTitle = !compact,
}: HealthAssessmentReportProps) {
  const [expandedInsight, setExpandedInsight] = useState(false)
  const [expandedRecs, setExpandedRecs] = useState(false)

  if (!record.risk_level) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Submit your health assessment to see your AI report here.
        </CardContent>
      </Card>
    )
  }

  const level = record.risk_level as RiskLevel
  const meta = RISK_META[level]
  const RiskIcon = RISK_ICONS[level]
  const vitals = getVitalHighlights(record)
  const recs = record.recommendations
  const insightShort = record.risk_explanation ? essence(record.risk_explanation) : ''
  const insightFull = record.risk_explanation ?? ''
  const showFullInsight = expandedInsight || insightShort === insightFull
  const tipsPerCategory = expandedRecs ? 3 : 1
  const summaryWords = compact ? 8 : 10

  const scoredAt = record.risk_scored_at
    ? new Date(record.risk_scored_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="space-y-4">
      {showTitle && (
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Health Assessment
          </h2>
          {scoredAt && <p className="text-sm text-muted-foreground">Assessed {scoredAt}</p>}
        </div>
      )}

      {/* Risk + vitals hero */}
      <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'lg:grid-cols-5')}>
        <Card className={cn('border-2 lg:col-span-2', meta.bg)}>
          <CardContent className="pt-6 pb-5">
            <div className="flex items-start gap-4">
              <div className={cn('rounded-full p-3 bg-background/80', meta.color)}>
                <RiskIcon className="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Diabetes risk</p>
                <p className={cn('text-2xl font-bold', meta.color)}>{meta.label}</p>
                <div className="mt-3 space-y-1">
                  <Progress value={meta.score} className={cn('h-2', RISK_BAR_CLASS[level])} />
                  <p className="text-xs text-muted-foreground">Risk index {meta.score}/100</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className={cn('grid grid-cols-2 gap-2', compact ? '' : 'lg:col-span-3 lg:grid-cols-4')}>
          {vitals.map((v) => (
            <div
              key={v.label}
              className={cn('rounded-xl border p-3', TONE_STYLES[v.tone])}
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{v.label}</p>
              <p className="text-lg font-semibold mt-0.5">{v.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI insight — short by default */}
      {insightFull && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">What this means</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm leading-relaxed">
              {showFullInsight ? insightFull : insightShort}
            </p>
            {insightShort !== insightFull && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8 px-2 text-primary"
                onClick={() => setExpandedInsight((v) => !v)}
              >
                {expandedInsight ? (
                  <>Show less <ChevronUp className="ml-1 h-3 w-3" /></>
                ) : (
                  <>Read more <ChevronDown className="ml-1 h-3 w-3" /></>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action suggestions — compact summaries */}
      {recs && isStructuredRecs(recs) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suggested actions</CardTitle>
            {recs.summary && (
              <p className="text-xs text-muted-foreground leading-snug pt-1">
                {summaryLine(recs.summary)}
              </p>
            )}
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {CATEGORY_CONFIG.map(({ key, label, icon: Icon, accent }) => {
                const allItems = recs.categories[key] ?? []
                const items = expandedRecs ? allItems : allItems.slice(0, tipsPerCategory)
                if (!items.length) return null
                return (
                  <div key={key} className="rounded-lg border bg-muted/30 p-2.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className={cn('rounded p-1', accent)}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
                    </div>
                    <ul className="space-y-1">
                      {items.map((item, i) => (
                        <li key={i} className="flex gap-1.5 text-[11px] leading-snug text-foreground/85">
                          <span className="text-primary shrink-0">•</span>
                          <span>{expandedRecs ? item : summarizeTip(item, summaryWords)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
            {Object.values(recs.categories).some((items) => (items?.length ?? 0) > 1) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-primary"
                onClick={() => setExpandedRecs((v) => !v)}
              >
                {expandedRecs ? (
                  <>Show summaries <ChevronUp className="ml-1 h-3 w-3" /></>
                ) : (
                  <>View full suggestions <ChevronDown className="ml-1 h-3 w-3" /></>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {recs && Array.isArray(recs) && recs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Suggested actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {(expandedRecs ? recs : recs.slice(0, 4)).map((item, i) => (
                <li key={i} className="flex gap-1.5 text-[11px] leading-snug text-foreground/85">
                  <span className="text-primary shrink-0">•</span>
                  <span>{expandedRecs ? String(item) : summarizeTip(String(item), summaryWords)}</span>
                </li>
              ))}
            </ul>
            {recs.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-2 text-xs text-primary"
                onClick={() => setExpandedRecs((v) => !v)}
              >
                {expandedRecs ? 'Show summaries' : `View all ${recs.length} suggestions`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
