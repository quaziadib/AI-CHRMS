'use client'

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { HealthTrends } from '@/lib/api'

interface HealthHistoryChartsProps {
  trends: HealthTrends
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

export function HealthHistoryCharts({ trends }: HealthHistoryChartsProps) {
  const chartData = trends.submissions.map((s) => ({
    label: formatDate(s.submitted_at),
    glucose: s.blood_glucose ?? null,
    bmi: s.bmi,
    risk: s.risk_score ?? null,
    systolic: s.bp_systolic,
    diastolic: s.bp_diastolic,
    pid: s.pid,
  }))

  if (chartData.length === 0) {
    return null
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Blood Glucose Over Time</CardTitle>
          <CardDescription>All submissions (mg/dL)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="glucose" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} name="Glucose" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">BMI Trend</CardTitle>
          <CardDescription>Body mass index across submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bmi" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} name="BMI" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Blood Pressure</CardTitle>
          <CardDescription>Systolic / diastolic (mmHg)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="systolic" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Systolic" />
              <Line type="monotone" dataKey="diastolic" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} name="Diastolic" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Risk Level Trend</CardTitle>
          <CardDescription>1 = low, 2 = moderate, 3 = high</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 4]} ticks={[1, 2, 3]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="risk" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} name="Risk score" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
