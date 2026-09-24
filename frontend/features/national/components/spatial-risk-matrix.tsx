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
              Database aggregates
            </span>
            <h4 className="mt-2 text-base font-semibold">{spatial.title}</h4>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Selected district</div>
            <div className="text-sm font-semibold text-emerald-300">{spatial.district_id ?? 'All districts'}</div>
          </div>
        </div>
        {spatial.districts.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {spatial.districts.map((h) => (
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
        </div> : <p className="rounded-md border border-dashed border-slate-700 p-4 text-sm text-slate-300">No districts in this scope have enough scored database records to display a rate.</p>}
      </div>
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <Metric
          label="High-risk share change YoY"
          value={spatial.metrics.high_risk_share_change_yoy_percentage_points == null
            ? 'No stored history'
            : `${spatial.metrics.high_risk_share_change_yoy_percentage_points > 0 ? '+' : ''}${spatial.metrics.high_risk_share_change_yoy_percentage_points} pp`}
        />
        <Metric label="Average record age" value={spatial.metrics.mean_record_age_years == null ? 'No database data' : `${spatial.metrics.mean_record_age_years} yrs`} />
        <Metric label="Screening coverage" value={spatial.metrics.screening_coverage_percent == null ? 'Not collected' : `${spatial.metrics.screening_coverage_percent}%`} />
      </div>
      <p className="text-xs text-muted-foreground">{spatial.metric_basis}</p>
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
