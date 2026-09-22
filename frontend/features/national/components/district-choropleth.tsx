'use client'

import type { DistrictSummary } from '@/lib/api/national'
import { cn } from '@/lib/utils'

/** Stylized Bangladesh layout — MVP district labels as choropleth tiles (not official GIS). */
const LAYOUT: { id: string; x: number; y: number; w: number; h: number }[] = [
  { id: 'Rangpur', x: 30, y: 8, w: 28, h: 14 },
  { id: 'Dinajpur', x: 8, y: 14, w: 20, h: 12 },
  { id: 'Rajshahi', x: 18, y: 28, w: 26, h: 16 },
  { id: 'Bogra', x: 46, y: 24, w: 18, h: 12 },
  { id: 'Mymensingh', x: 52, y: 36, w: 22, h: 12 },
  { id: 'Sylhet', x: 76, y: 28, w: 20, h: 16 },
  { id: 'Dhaka', x: 48, y: 48, w: 22, h: 14 },
  { id: 'Gazipur', x: 58, y: 42, w: 14, h: 8 },
  { id: 'Narayanganj', x: 62, y: 52, w: 12, h: 8 },
  { id: 'Comilla', x: 72, y: 52, w: 16, h: 12 },
  { id: 'Chittagong', x: 78, y: 64, w: 18, h: 16 },
  { id: "Cox's Bazar", x: 82, y: 80, w: 14, h: 12 },
  { id: 'Khulna', x: 28, y: 58, w: 22, h: 14 },
  { id: 'Jessore', x: 22, y: 70, w: 18, h: 10 },
  { id: 'Barisal', x: 48, y: 68, w: 20, h: 12 },
  { id: 'Other', x: 8, y: 84, w: 16, h: 10 },
]

function rateColor(rate: number | null | undefined, suppressed: boolean): string {
  if (suppressed) return '#d4d4d8'
  if (rate == null) return '#e4e4e7'
  if (rate >= 0.4) return '#b91c1c'
  if (rate >= 0.25) return '#ea580c'
  if (rate >= 0.1) return '#ca8a04'
  return '#16a34a'
}

type Props = {
  districts: DistrictSummary[]
  empty?: boolean
}

export function DistrictChoropleth({ districts, empty }: Props) {
  const byName = new Map(districts.map((d) => [d.district, d]))

  if (empty || districts.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">
        No district aggregate data yet — scored health records will appear here.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <svg viewBox="0 0 100 100" className="h-72 w-full rounded-lg border bg-slate-50" role="img" aria-label="District risk choropleth">
        {LAYOUT.map((cell) => {
          const data = byName.get(cell.id)
          const suppressed = data?.suppressed ?? false
          const rate = data?.high_risk_rate ?? null
          return (
            <g key={cell.id}>
              <rect
                x={cell.x}
                y={cell.y}
                width={cell.w}
                height={cell.h}
                rx={1.2}
                fill={rateColor(rate, suppressed || !data)}
                stroke="#fff"
                strokeWidth={0.4}
              />
              <text
                x={cell.x + cell.w / 2}
                y={cell.y + cell.h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white"
                style={{ fontSize: 2.4, fontWeight: 600 }}
              >
                {cell.id.length > 10 ? cell.id.slice(0, 9) + '…' : cell.id}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Legend swatch="#16a34a" label="Low high-risk rate" />
        <Legend swatch="#ca8a04" label="Moderate" />
        <Legend swatch="#ea580c" label="Elevated" />
        <Legend swatch="#b91c1c" label="High" />
        <Legend swatch="#d4d4d8" label="Suppressed / unknown" />
      </div>
      <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        {districts.map((d) => (
          <li key={d.district} className={cn('flex justify-between gap-2 rounded px-2 py-1', d.suppressed && 'opacity-60')}>
            <span>{d.district}</span>
            <span>
              {d.suppressed
                ? 'suppressed'
                : `${Math.round((d.high_risk_rate ?? 0) * 100)}% high-risk · n=${d.record_count}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-sm" style={{ background: swatch }} />
      {label}
    </span>
  )
}
