'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DemographicsChart, DivisionChart } from '@/lib/api/national'

export function DivisionPrevalenceChart({ data }: { data: DivisionChart | null }) {
  if (!data || data.empty) {
    return <EmptyChart label="No division aggregate data yet (min cell size applies)." />
  }
  // Omit suppressed / under-threshold cells — never paint null as 0%.
  const rows = data.labels
    .map((label, i) => ({
      name: label,
      prevalence: data.prevalence_percent[i],
    }))
    .filter((row): row is { name: string; prevalence: number } => row.prevalence != null)

  if (rows.length === 0) {
    return <EmptyChart label="No division aggregate data yet (min cell size applies)." />
  }

  return (
    <div className="h-72 w-full">
      <p className="mb-2 text-xs text-muted-foreground">
        National benchmark: {data.national_benchmark_percent}%
      </p>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="prevalence" fill="#16a34a" radius={[4, 4, 0, 0]} name="Prevalence %" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DemographicsPrevalenceChart({ data }: { data: DemographicsChart | null }) {
  if (!data || data.empty) {
    return <EmptyChart label="No demographics aggregate data yet (min cell size applies)." />
  }
  // Keep nulls as null so Recharts skips bars; do not coerce to 0%.
  const rows = data.labels.map((label, i) => ({
    name: label,
    male: data.male_prevalence_percent[i],
    female: data.female_prevalence_percent[i],
  }))
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="male" fill="#3b82f6" name="Male %" radius={[4, 4, 0, 0]} />
          <Bar dataKey="female" fill="#ec4899" name="Female %" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      {label}
    </div>
  )
}
