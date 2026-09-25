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
      <div className="relative overflow-hidden rounded-lg border bg-muted/30 p-5 text-foreground">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-primary">
              Database aggregates
            </span>
            <h4 className="mt-2 text-base font-semibold">{spatial.title}</h4>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <div>Selected district</div>
            <div className="text-sm font-semibold text-primary">{spatial.district_id ?? 'All districts'}</div>
          </div>
        </div>
        {spatial.districts.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {spatial.districts.map((h) => (
            <div key={h.label} className="rounded-lg border bg-card p-2.5 text-center">
              <span className="block text-[11px] text-muted-foreground">{h.label}</span>
              <span
                className={cn(
                  'text-base font-bold',
                  h.severity === 'critical' || h.rate > 25
                    ? 'text-destructive'
                    : h.rate >= 15
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-primary'
                )}
              >
                {h.rate}%
              </span>
              <span className="block text-[10px] capitalize text-muted-foreground">{h.severity}</span>
            </div>
          ))}
        </div> : <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No districts in this scope have enough scored database records to display a rate.</p>}
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
