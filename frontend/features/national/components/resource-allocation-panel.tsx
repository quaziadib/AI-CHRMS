'use client'

import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ResourceEstimate } from '@/lib/api/national'

type Props = {
  resources: ResourceEstimate[]
  onExport: () => void
  isExporting: boolean
  onForecast: () => void
  isForecasting: boolean
  forecastStatus?: string | null
}

export function ResourceAllocationPanel({
  resources,
  onExport,
  isExporting,
  onForecast,
  isForecasting,
  forecastStatus,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onExport} disabled={isExporting}>
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export CSV
        </Button>
        <Button type="button" size="sm" onClick={onForecast} disabled={isForecasting}>
          {isForecasting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Run population forecast
        </Button>
        {forecastStatus ? (
          <span className="text-xs text-muted-foreground">Latest forecast: {forecastStatus}</span>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">District</th>
              <th className="px-3 py-2 font-medium">Projected high-risk</th>
              <th className="px-3 py-2 font-medium">Testing kits</th>
              <th className="px-3 py-2 font-medium">Medicine packs</th>
              <th className="px-3 py-2 font-medium">Clinic sites</th>
              <th className="px-3 py-2 font-medium">Source</th>
            </tr>
          </thead>
          <tbody>
            {resources.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  No resource estimates yet.
                </td>
              </tr>
            ) : (
              resources.map((r) => (
                <tr key={r.district} className="border-t">
                  <td className="px-3 py-2">{r.district}</td>
                  {r.suppressed ? (
                    <td colSpan={5} className="px-3 py-2 text-muted-foreground">
                      Suppressed (below minimum cell size)
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-2">{r.projected_high_risk ?? '—'}</td>
                      <td className="px-3 py-2">{r.testing_kits ?? '—'}</td>
                      <td className="px-3 py-2">{r.medicine_packs ?? '—'}</td>
                      <td className="px-3 py-2">{r.clinic_sites ?? '—'}</td>
                      <td className="px-3 py-2 capitalize">{r.source}</td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
