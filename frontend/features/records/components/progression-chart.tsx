'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { ForecastJob, PatientRecord } from '@/lib/api'
import { recordsApi } from '@/lib/api'

interface ProgressionChartProps {
  record: PatientRecord
}

export function ProgressionChart({ record }: ProgressionChartProps) {
  const [job, setJob] = useState<ForecastJob | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const pollJob = useCallback(async (recordId: string, jobId: string) => {
    const { data } = await recordsApi.getForecast(recordId, jobId)
    if (data) setJob(data)
    return data
  }, [])

  useEffect(() => {
    if (!record.risk_level) return
    recordsApi.getLatestForecast(record.id).then(({ data }) => {
      if (data) setJob(data)
    })
  }, [record.id, record.risk_level])

  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') return
    const interval = setInterval(async () => {
      const updated = await pollJob(record.id, job.id)
      if (updated && (updated.status === 'completed' || updated.status === 'failed')) {
        clearInterval(interval)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [job, pollJob, record.id])

  const handleGenerate = async () => {
    setIsStarting(true)
    const { data, error } = await recordsApi.startForecast(record.id)
    if (data && !error) {
      setJob(data)
      toast.success('Forecast started — results will appear shortly')
    } else {
      toast.error(error || 'Failed to start forecast')
    }
    setIsStarting(false)
  }

  if (!record.risk_level) {
    return null
  }

  const isRunning = job?.status === 'pending' || job?.status === 'running'
  const chartData = job?.result?.points.map((p) => ({
    date: p.date,
    glucose: p.glucose_mg_dl,
    type: p.kind === 'actual' ? 'Actual' : 'Forecast',
  })) ?? []
  const glucoseValues = chartData.map(({ glucose }) => glucose).filter(Number.isFinite)
  const minGlucose = glucoseValues.length ? Math.min(...glucoseValues) : 0
  const maxGlucose = glucoseValues.length ? Math.max(...glucoseValues) : 1
  const glucoseRange = maxGlucose - minGlucose
  const glucosePadding = Math.max(glucoseRange * 0.15, Math.abs((minGlucose + maxGlucose) / 2) * 0.005, 0.5)
  const glucoseDomain: [number, number] = [
    Math.max(0, minGlucose - glucosePadding),
    maxGlucose + glucosePadding,
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Blood Glucose Progression
            </CardTitle>
            <CardDescription>6-month trajectory forecast (ARIMA / trend model)</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isStarting || isRunning}
            className="gap-1"
          >
            {isStarting || isRunning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <TrendingUp className="h-3 w-3" />
            )}
            {job?.result ? 'Refresh Forecast' : 'Generate Forecast'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isRunning && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Spinner size="sm" />
            Running forecast in background…
          </div>
        )}

        {job?.status === 'failed' && (
          <p className="text-sm text-destructive py-4">
            Forecast failed: {job.error_message || 'Unknown error'}
          </p>
        )}

        {job?.result && chartData.length > 0 && !isRunning && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{job.result.summary}</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={glucoseDomain} unit=" mg/dL" tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="glucose"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Glucose (mg/dL)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!job && !isStarting && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Generate a forecast to see your projected blood glucose trajectory.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
