'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { useRecords } from '@/features/records/hooks/use-records'
import { RecordCard } from '@/features/records/components/record-card'
import { RecordDetail } from '@/features/records/components/record-detail'
import { RecordEditForm } from '@/features/records/components/record-edit-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { FileText, Plus } from 'lucide-react'

export default function RecordsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

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
  } = useRecords()

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

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
          <p className="text-muted-foreground">Your submitted health assessments</p>
        </div>
        {records.length === 0 && !isLoading && (
          <Button onClick={() => router.push('/health-form')} className="gap-2">
            <Plus className="h-4 w-4" />
            New Record
          </Button>
        )}
      </div>

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
