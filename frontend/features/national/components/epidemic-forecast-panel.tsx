'use client'

import { Loader2 } from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import type { EpidemicForecastJob } from '@/lib/api/national'

type Props = {
  epidemic: EpidemicForecastJob | null
  onRun: () => void
  isForecasting: boolean
}

export function EpidemicForecastPanel({ epidemic, onRun, isForecasting }: Props) {
  const series = epidemic?.result?.series ?? []
  const groups = epidemic?.result?.risk_groups ?? []
  const status = epidemic?.status ?? 'none'
  const pending = status === 'pending' || status === 'running'
  const failed = status === 'failed'

  const chartRows = series.map((p) => ({
    year: String(p.year),
    urban: p.urban_prevalence_percent,
    rural: p.rural_prevalence_percent,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={onRun} disabled={isForecasting || pending}>
          {isForecasting || pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Run LLM epidemic forecast
        </Button>
        <span className="text-xs text-muted-foreground">Status: {status}</span>
      </div>

      {pending ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating multi-year urban/rural trajectory…
        </div>
      ) : failed ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-destructive/40 px-6 text-center text-sm text-muted-foreground">
          <p>Forecast failed{epidemic?.error_message ? `: ${epidemic.error_message}` : '.'}</p>
          <p>Run again to regenerate the chart.</p>
        </div>
      ) : chartRows.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          No epidemic forecast yet — run LLM forecast to populate the chart.
        </div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="urban" stroke="#16a34a" strokeWidth={2} name="Urban %" />
              <Line type="monotone" dataKey="rural" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Rural %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {epidemic?.result?.summary ? (
        <p className="text-sm text-muted-foreground">{epidemic.result.summary}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {groups.length === 0
          ? ['Low risk', 'Prediabetes / at-risk', 'High risk / type-2'].map((label) => (
              <div key={label} className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                {label} — awaiting forecast
              </div>
            ))
          : groups.map((g) => (
              <div key={g.key} className="rounded-lg border bg-card p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</div>
                <div className="mt-1 text-2xl font-bold">
                  {g.population_share_percent.toFixed(1)}%
                  <span className="ml-1 text-xs font-normal text-muted-foreground">of population</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{g.guidance}</p>
              </div>
            ))}
      </div>
    </div>
  )
}
