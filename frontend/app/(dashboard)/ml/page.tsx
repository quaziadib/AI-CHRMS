'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, BrainCircuit } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { mlApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

export default function MLPage() {
  const { isMLEngineer, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [result, setResult] = useState<{ total: number; returned: number; data: Record<string, unknown>[] } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [limit, setLimit] = useState(100)
  const [verifiedOnly, setVerifiedOnly] = useState(true)

  useEffect(() => {
    if (!authLoading && !isMLEngineer) router.replace('/dashboard')
  }, [authLoading, isMLEngineer, router])

  const fetchData = async () => {
    setIsLoading(true)
    const { data } = await mlApi.getData({ limit, verified_only: verifiedOnly })
    if (data) setResult(data)
    setIsLoading(false)
  }

  const downloadJSON = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chrms-dataset-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadCSV = () => {
    if (!result || result.data.length === 0) return
    const keys = Object.keys(result.data[0])
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = result.data.map(row => keys.map(k => escape(row[k])).join(','))
    const csv = [keys.map(escape).join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chrms-dataset-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (authLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ML Dataset</h1>
        <p className="text-muted-foreground text-sm">
          Anonymized health records for model training. All PII is stripped — only health metrics are included.
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Record Limit</label>
              <select
                value={limit}
                onChange={e => setLimit(Number(e.target.value))}
                className="block rounded-md border bg-background px-3 py-2 text-sm"
              >
                {[100, 500, 1000, 2000].map(n => (
                  <option key={n} value={n}>{n} records</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium pb-2">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={e => setVerifiedOnly(e.target.checked)}
              />
              Verified records only
            </label>
            <Button onClick={fetchData} disabled={isLoading}>
              {isLoading ? <Spinner size="sm" className="mr-2" /> : <BrainCircuit className="h-4 w-4 mr-2" />}
              Fetch Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-muted-foreground">
              Showing <strong>{result.returned}</strong> of <strong>{result.total}</strong> total records
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadCSV}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={downloadJSON}>
                <Download className="h-4 w-4 mr-1" /> JSON
              </Button>
            </div>
          </div>

          {result.data.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <table className="text-xs w-full">
                <thead className="bg-muted">
                  <tr>
                    {Object.keys(result.data[0]).map(k => (
                      <th key={k} className="px-3 py-2 text-left font-medium whitespace-nowrap">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.data.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-t">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="px-3 py-1.5 whitespace-nowrap">
                          {String(v ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.data.length > 20 && (
                <p className="text-xs text-muted-foreground px-3 py-2">
                  Showing first 20 rows. Download CSV/JSON for the full dataset.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
