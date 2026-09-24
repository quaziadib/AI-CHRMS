'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import { Spinner } from '@/components/ui/spinner'
import { ResubmitBanner } from '@/features/dashboard/components/resubmit-banner'
import { HealthHistoryCharts } from '@/features/dashboard/components/health-history-charts'
import { HealthAssessmentReport } from '@/features/records/components/health-assessment-report'
import { ProgressionChart } from '@/features/records/components/progression-chart'
import { PersonalizedPlanWidget } from '@/features/records/components/personalized-plan-widget'
import { RecordDetail } from '@/features/records/components/record-detail'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { recordsApi } from '@/lib/api'
import type { HealthTrends, PatientRecord, ResubmitStatus } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const ROLE_HOMES: Record<string, string> = {
  admin: '/admin',
  doctor: '/doctor',
  national_admin: '/national',
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [resubmitStatus, setResubmitStatus] = useState<ResubmitStatus | null>(null)
  const [trends, setTrends] = useState<HealthTrends | null>(null)
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) return

    const role = user.roles.find((r) => r in ROLE_HOMES)
    if (role && role !== 'user') {
      router.replace(ROLE_HOMES[role])
      return
    }

    Promise.all([
      recordsApi.getResubmitStatus(),
      recordsApi.getHealthTrends(),
      recordsApi.list(),
    ]).then(([statusRes, trendsRes, recordsRes]) => {
      if (statusRes.data) setResubmitStatus(statusRes.data)
      if (trendsRes.data) setTrends(trendsRes.data)
      if (recordsRes.data) {
        setRecords(recordsRes.data)
        setExpandedSubmission(recordsRes.data[0]?.id ?? null)
      }
      setLoading(false)
    })
  }, [user, authLoading, router])

  const latestRecord = records[0] ?? null
  const refreshRecord = (updatedRecord: PatientRecord) => {
    setRecords((current) => current.map((record) => record.id === updatedRecord.id ? updatedRecord : record))
  }

  if (authLoading || !user || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Health Dashboard</h1>
          <p className="text-muted-foreground">
            Track your assessments, resubmit schedule, and health trends over time
          </p>
        </div>
        <Button variant="outline" asChild className="gap-2 shrink-0">
          <Link href="/records">
            <FileText className="h-4 w-4" />
            All Records ({resubmitStatus?.submission_count ?? 0})
          </Link>
        </Button>
      </div>

      {resubmitStatus && <ResubmitBanner status={resubmitStatus} />}

      {latestRecord?.risk_level && (
        <>
          <HealthAssessmentReport record={latestRecord} compact />
          <PersonalizedPlanWidget record={latestRecord} onUpdated={refreshRecord} />
        </>
      )}

      {trends && trends.submissions.length > 0 && (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-1">Health Trends</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Charts from all {trends.submissions.length} stored submission
              {trends.submissions.length === 1 ? '' : 's'}
            </p>
            <HealthHistoryCharts trends={trends} />
          </div>
          {latestRecord && <ProgressionChart record={latestRecord} />}
        </>
      )}

      {records.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">All Submissions</h2>
            <p className="text-sm text-muted-foreground">Your latest assessment is open by default.</p>
          </div>
          {records.map((record, index) => {
            const isExpanded = expandedSubmission === record.id
            return (
              <Card key={record.id}>
                <CardHeader
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => setExpandedSubmission(isExpanded ? null : record.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base font-mono">
                        {record.pid}{index === 0 ? ' · Latest submission' : ''}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {record.age} yrs · {record.gender} · {record.district} · {formatDate(record.created_at)}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {isExpanded && <RecordDetail record={record} />}
              </Card>
            )
          })}
        </section>
      )}
    </div>
  )
}
