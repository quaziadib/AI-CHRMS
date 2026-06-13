'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import { useRecords } from '@/features/records/hooks/use-records'
import { RecordCard } from '@/features/records/components/record-card'
import { RecordDetail } from '@/features/records/components/record-detail'
import { RecordEditForm } from '@/features/records/components/record-edit-form'
import { HealthAssessmentReport } from '@/features/records/components/health-assessment-report'
import { PersonalizedPlanWidget } from '@/features/records/components/personalized-plan-widget'
import { ProgressionChart } from '@/features/records/components/progression-chart'
import { ResubmitBanner } from '@/features/dashboard/components/resubmit-banner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { FileText, Plus, RefreshCw } from 'lucide-react'
import { recordsApi } from '@/lib/api'
import type { ResubmitStatus } from '@/lib/api'

export default function RecordsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [resubmitStatus, setResubmitStatus] = useState<ResubmitStatus | null>(null)

  const {
    records,
    isLoading,
    expandedRecord,
    editingId,
    editData,
    isSaving,
    startEdit,
    cancelEdit,
    setField,
    saveEdit,
    toggleExpand,
    refreshRecord,
  } = useRecords()

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      recordsApi.getResubmitStatus().then(({ data }) => {
        if (data) setResubmitStatus(data)
      })
    }
  }, [user])

  if (authLoading || !user) {
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
          <h1 className="text-2xl font-bold text-foreground">My Health Records</h1>
          <p className="text-muted-foreground">
            All submitted assessments — {records.length} on file
          </p>
        </div>
        {resubmitStatus?.can_submit_new && records.length > 0 && (
          <Button asChild className="gap-2">
            <Link href="/health-form">
              <RefreshCw className="h-4 w-4" />
              Resubmit Assessment
            </Link>
          </Button>
        )}
        {records.length === 0 && !isLoading && (
          <Button onClick={() => router.push('/health-form')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Record
          </Button>
        )}
      </div>

      {resubmitStatus && <ResubmitBanner status={resubmitStatus} />}

      {records.length > 0 && (
        <>
          <HealthAssessmentReport record={records[0]} />
          <PersonalizedPlanWidget record={records[0]} onUpdated={refreshRecord} />
          <ProgressionChart record={records[0]} />
        </>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Records Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven&apos;t submitted any health records yet.
            </p>
            <Button onClick={() => router.push('/health-form')} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => {
            const isEditing = editingId === record.id
            const isExpanded = expandedRecord === record.id

            return (
              <Card key={record.id} className="overflow-hidden">
                <RecordCard
                  record={record}
                  isEditing={isEditing}
                  isExpanded={isExpanded}
                  onEdit={startEdit}
                  onToggleExpand={toggleExpand}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  isSaving={isSaving}
                />
                {isExpanded && !isEditing && (
                  <RecordDetail record={record} />
                )}
                {isEditing && (
                  <RecordEditForm
                    editData={editData}
                    setField={setField}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                    isSaving={isSaving}
                  />
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
