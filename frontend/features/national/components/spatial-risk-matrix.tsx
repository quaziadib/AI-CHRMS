'use client'

import type { SpatialPanel } from '@/lib/api/national'
import { cn } from '@/lib/utils'

export function SpatialRiskMatrix({ spatial }: { spatial: SpatialPanel | null }) {
  if (!spatial) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Select a region to load the spatial risk matrix.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg border bg-slate-900 p-5 text-white">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
              Spatial heat grid
            </span>
            <h4 className="mt-2 text-base font-semibold">{spatial.title}</h4>
            {spatial.synthesis ? (
              <p className="mt-1 text-xs text-slate-400">Includes curated synthesis where record grain is limited.</p>
            ) : null}
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Selected district</div>
            <div className="text-sm font-semibold text-emerald-300">{spatial.district_id ?? '—'}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {spatial.hotspots.map((h) => (
            <div key={h.label} className="rounded-lg border border-slate-700 bg-slate-800/80 p-2.5 text-center">
              <span className="block text-[11px] text-slate-400">{h.label}</span>
              <span
                className={cn(
                  'text-base font-bold',
                  h.severity === 'critical' || h.rate > 25
                    ? 'text-red-400'
                    : h.rate >= 15
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                )}
              >
                {h.rate}%
              </span>
              <span className="block text-[10px] capitalize text-slate-400">{h.severity}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <Metric label="Prevalence growth YoY" value={`+${spatial.metrics.prevalence_growth_yoy_percent}%`} />
        <Metric label="Avg diagnosis age" value={`${spatial.metrics.avg_diagnosis_age} yrs`} />
        <Metric label="Screening coverage" value={`${spatial.metrics.screening_coverage_percent}%`} />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold text-foreground">{value}</div>
    </div>
  )
}
