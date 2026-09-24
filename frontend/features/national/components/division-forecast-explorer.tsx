'use client'

import { useMemo, useState } from 'react'
import { Loader2, WandSparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DivisionForecastJob, GeoOption } from '@/lib/api/national'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type Props = {
  divisions: GeoOption[]
  scopeId: string
  forecast: DivisionForecastJob | null
  onScopeChange: (scope: string) => void
  onGenerate: () => Promise<void>
  disabled: boolean
}

const COLORS = ['#047857', '#2563eb', '#c2410c', '#7c3aed', '#be123c', '#0891b2', '#4d7c0f', '#9333ea']
const EMPTY_SERIES: NonNullable<NonNullable<DivisionForecastJob['result']>['series']> = []

export function DivisionForecastExplorer({ divisions, scopeId, forecast, onScopeChange, onGenerate, disabled }: Props) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  const [isGenerating, setIsGenerating] = useState(false)
  const result = forecast?.result
  const series = result?.series ?? EMPTY_SERIES
  const focusedSeries = scopeId === 'all' ? undefined : series.find((region) => region.id === scopeId)
  const observedPoints = focusedSeries?.points.filter((point) => point.kind === 'observed' && point.value != null) ?? []
  const latestObserved = observedPoints[observedPoints.length - 1]
  const projected2035 = focusedSeries?.points.find((point) => point.year === 2035 && point.kind === 'projected')
  const pending = forecast?.status === 'pending' || forecast?.status === 'running'
  const generateForecast = async () => {
    setIsGenerating(true)
    try {
      await onGenerate()
    } finally {
      setIsGenerating(false)
    }
  }
  const chartRows = useMemo(() => {
    const years = result?.display_years ?? [...new Set(series.flatMap((region) => region.points.map((point) => point.year)))].sort((a, b) => a - b)
      return years.map((year) => {
      const row: Record<string, string | number | null> = { year }
      for (const region of series) {
        const point = region.points.find((item) => item.year === year)
        const value = point?.value == null ? null : point.value * 100
        row[`${region.id}_observed`] = point?.kind === 'observed' ? value : null
        row[`${region.id}_projected`] = point?.kind === 'projected' ? value : null
      }
      return row
    })
  }, [result?.display_years, series])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1 text-sm font-medium">
          Forecast scope
          <select className="mt-1 block w-full rounded-md border bg-background px-3 py-2" value={scopeId} onChange={(event) => onScopeChange(event.target.value)}>
            <option value="all">All divisions (compare)</option>
            {divisions.map((division) => <option key={division.id} value={division.id}>{division.name}</option>)}
          </select>
        </label>
        <span className="text-xs text-muted-foreground">Job: {forecast?.status ?? 'not requested'}</span>
        <Button type="button" className="gap-2" onClick={generateForecast} disabled={disabled || pending || isGenerating} aria-busy={isGenerating}>
          {isGenerating || pending ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
          {pending ? 'Generating…' : isGenerating ? 'Starting…' : forecast?.status === 'completed' ? 'Regenerate forecast' : 'Generate forecast'}
        </Button>
      </div>

      {disabled ? <div role="status" className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Division forecasting is disabled on the API.</div> : null}

      {forecast?.status === 'failed' ? (
        <div role="status" className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">Forecast unavailable: {forecast.error_message || 'The job failed.'}</div>
      ) : pending ? (
        <div role="status" className="flex h-52 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Building a scenario from available annual aggregates…</div>
      ) : forecast?.status !== 'completed' ? (
        <div className="flex h-52 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">No saved forecast job exists for this scope. Stored database observations appear when enough records are available.</div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Annual high-risk share among scored submitted health records. Solid lines show database observations; dashed lines show projections from the saved forecast job.</p>
            <div className="flex shrink-0 gap-1">
              <Button type="button" variant={view === 'chart' ? 'default' : 'outline'} size="sm" aria-pressed={view === 'chart'} onClick={() => setView('chart')}>Chart</Button>
              <Button type="button" variant={view === 'table' ? 'default' : 'outline'} size="sm" aria-pressed={view === 'table'} onClick={() => setView('table')}>Table</Button>
            </div>
          </div>

          {view === 'chart' ? (
            <div className="h-80 w-full" role="img" aria-label="Annual division submitted-record high-risk share, 2022 to 2035">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(value) => value == null ? 'Unavailable' : `${Number(value).toFixed(1)}%`} />
                  <Legend />
                  {series.map((region, index) => (
                    <Line key={`${region.id}-observed`} type="monotone" dataKey={`${region.id}_observed`} name={`${region.name} observed`} stroke={COLORS[index % COLORS.length]} strokeWidth={2} connectNulls={false} dot />
                  ))}
                  {series.map((region, index) => (
                    <Line key={`${region.id}-projected`} type="monotone" dataKey={`${region.id}_projected`} name={`${region.name} LLM scenario`} stroke={COLORS[index % COLORS.length]} strokeWidth={2} strokeDasharray="6 4" connectNulls={false} dot />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Observed and projected submitted-record high-risk shares from 2022 through 2035</caption>
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr><th scope="col" className="px-3 py-2">Year</th>{series.map((region) => <th scope="col" key={region.id} className="px-3 py-2">{region.name}</th>)}</tr></thead>
                <tbody>{chartRows.map((row) => <tr className="border-t" key={row.year}><th scope="row" className="px-3 py-2">{row.year}</th>{series.map((region) => {
                  const point = region.points.find((item) => item.year === row.year)
                  return <td key={region.id} className="px-3 py-2"><span>{point?.value == null ? 'Unavailable' : `${(point.value * 100).toFixed(1)}%`}</span>{point && point.kind !== 'unavailable' ? <span className="ml-1 text-xs text-muted-foreground">({point.kind})</span> : null}</td>
                })}</tr>)}</tbody>
              </table>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryMetric label="Observed through" value={latestObserved ? `${latestObserved.year}` : 'Unavailable'} />
            <SummaryMetric label="Latest observed share" value={latestObserved?.value == null ? 'Unavailable' : `${(latestObserved.value * 100).toFixed(1)}%`} />
            <SummaryMetric label="2035 scenario share" value={projected2035?.value == null ? 'Unavailable' : `${(projected2035.value * 100).toFixed(1)}%`} />
          </div>

          {series.every((region) => region.status === 'unavailable') ? <p className="text-sm text-muted-foreground">No division has enough unsuppressed annual history for this forecast scope.</p> : null}
          <p className="text-sm text-muted-foreground">Urban/rural split unavailable: these records do not include a validated urban/rural classification.</p>
          {result?.summary ? <p className="text-sm text-muted-foreground">{result.summary}</p> : null}
          <p className="text-xs text-muted-foreground">Observed points come from annual scored submissions. {result?.minimum_cell_size ? `Years below ${result.minimum_cell_size} scored records are suppressed.` : 'Years below the configured threshold are suppressed.'} Projections are read from the saved forecast job; missing years remain blank.</p>
        </>
      )}
    </div>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-semibold">{value}</p></div>
}
