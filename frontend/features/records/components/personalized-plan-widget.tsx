'use client'

import { useState } from 'react'
import { Salad, Dumbbell, RefreshCw, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { summarizeTip, summaryLine } from '@/lib/assessment-utils'
import type { PatientRecord, PersonalizedPlan } from '@/lib/api'
import { recordsApi } from '@/lib/api'

function isPlan(value: unknown): value is PersonalizedPlan {
  return typeof value === 'object' && value !== null && 'meals' in value && 'exercises' in value
}

interface PersonalizedPlanWidgetProps {
  record: PatientRecord
  onUpdated?: (record: PatientRecord) => void
}

export function PersonalizedPlanWidget({ record, onUpdated }: PersonalizedPlanWidgetProps) {
  const [expanded, setExpanded] = useState(false)
  const plan = record.personalized_plan

  const handleGenerate = async () => {
    const { data, error } = await recordsApi.generatePlan(record.id)
    if (data && !error) {
      toast.success('Personalized plan generated')
      onUpdated?.(data)
    } else {
      toast.error(error || 'Failed to generate plan')
    }
  }

  if (!plan || !isPlan(plan)) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 flex flex-col items-center gap-3 text-center">
          <CalendarDays className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground max-w-sm">
            AI-generated weekly meal and exercise plan based on your assessment.
          </p>
          <Button onClick={handleGenerate} disabled={!record.risk_level} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Generate Plan
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Your Weekly Plan
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleGenerate} className="gap-1">
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Essence summaries */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Salad className="h-4 w-4 text-green-700" />
              <span className="text-xs font-semibold uppercase text-green-800">Meals</span>
            </div>
            <p className="text-xs leading-snug text-green-900">{summaryLine(plan.meal_plan_summary, 14)}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="h-4 w-4 text-blue-700" />
              <span className="text-xs font-semibold uppercase text-blue-800">Exercise</span>
            </div>
            <p className="text-xs leading-snug text-blue-900">{summaryLine(plan.exercise_summary, 14)}</p>
          </div>
        </div>

        {/* Week at a glance */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {plan.meals.map((meal, i) => {
            const ex = plan.exercises[i]
            return (
              <div
                key={meal.day}
                className="shrink-0 w-[140px] rounded-lg border bg-card p-2.5 text-xs"
              >
                <p className="font-semibold text-foreground mb-1.5">{meal.day.slice(0, 3)}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mb-1">{summarizeTip(meal.lunch, 6)}</p>
                {ex && (
                  <p className="text-[11px] text-primary font-medium">{ex.duration_minutes}m {summarizeTip(ex.activity, 4)}</p>
                )}
              </div>
            )
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-1"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>Hide full plan <ChevronUp className="h-4 w-4" /></>
          ) : (
            <>View full 7-day plan <ChevronDown className="h-4 w-4" /></>
          )}
        </Button>

        {expanded && (
          <div className={cn('grid gap-4 lg:grid-cols-2 pt-2 border-t')}>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Salad className="h-4 w-4 text-green-600" /> Meals
              </h4>
              {plan.meals.map((day) => (
                <details key={day.day} className="rounded-lg border group">
                  <summary className="cursor-pointer px-3 py-2 text-sm font-medium list-none flex justify-between">
                    {day.day}
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-3 pb-3 text-xs space-y-1 text-muted-foreground border-t pt-2">
                    <p><span className="text-foreground font-medium">B:</span> {day.breakfast}</p>
                    <p><span className="text-foreground font-medium">L:</span> {day.lunch}</p>
                    <p><span className="text-foreground font-medium">D:</span> {day.dinner}</p>
                    <p><span className="text-foreground font-medium">S:</span> {day.snack}</p>
                  </div>
                </details>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-blue-600" /> Exercise
              </h4>
              {plan.exercises.map((day) => (
                <div key={day.day} className="rounded-lg border px-3 py-2 text-sm">
                  <p className="font-medium">{day.day}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {day.activity} · {day.duration_minutes} min
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
