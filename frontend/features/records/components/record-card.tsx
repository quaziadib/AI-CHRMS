'use client'

import { FileText, Calendar, ChevronDown, ChevronUp, Pencil, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { formatDate } from '@/lib/utils'
import type { PatientRecord } from '@/lib/api'

interface Props {
  record: PatientRecord
  isEditing: boolean
  isExpanded: boolean
  onEdit: (record: PatientRecord) => void
  onToggleExpand: (id: string) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

export function RecordCard({
  record,
  isEditing,
  isExpanded,
  onEdit,
  onToggleExpand,
  onSave,
  onCancel,
  isSaving,
}: Props) {
  return (
    <CardHeader
      className={`transition-colors ${!isEditing ? 'cursor-pointer hover:bg-muted/50' : ''}`}
      onClick={() => {
        if (!isEditing) {
          onToggleExpand(record.id)
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-mono">{record.pid}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1 flex-wrap">
              <span>{record.age} yrs • {record.gender} • {record.district}</span>
              <span>•</span>
              <Calendar className="h-3 w-3" />
              <span>{formatDate(record.created_at)}</span>
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {isEditing ? (
            <>
              <Button size="sm" onClick={onSave} disabled={isSaving} className="gap-1">
                {isSaving ? <Spinner size="sm" /> : <Check className="h-4 w-4" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => onEdit(record)} className="gap-1">
                <Pencil className="h-4 w-4" />
                Edit Request
              </Button>
              {isExpanded
                ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </>
          )}
        </div>
      </div>
    </CardHeader>
  )
}
