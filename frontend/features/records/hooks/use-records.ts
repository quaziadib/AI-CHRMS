'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { recordsApi } from '@/lib/api'
import { calculateBMI } from '@/lib/utils'
import type { PatientRecord } from '@/lib/api'

type EditData = Partial<PatientRecord>

export function useRecords() {
  const [records, setRecords] = useState<PatientRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<EditData>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    recordsApi.list().then(({ data }) => {
      if (data) setRecords(data)
      setIsLoading(false)
    })
  }, [])

  const startEdit = (record: PatientRecord) => {
    setEditingId(record.id)
    setEditData({ ...record })
    setExpandedRecord(record.id)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditData({})
  }

  const setField = (field: string, value: unknown) => {
    setEditData(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'height' || field === 'weight') {
        const h = field === 'height' ? Number(value) : Number(prev.height)
        const w = field === 'weight' ? Number(value) : Number(prev.weight)
        if (h > 0 && w > 0) next.bmi = calculateBMI(h, w)
      }
      return next
    })
  }

  const saveEdit = async () => {
    if (!editingId) return
    setIsSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, user_id, pid, created_at, updated_at, ...updatePayload } = editData as PatientRecord
    const { error } = await recordsApi.update(editingId, updatePayload)
    if (!error) {
      setRecords(records.map(r => r.id === editingId ? { ...r, ...editData } : r))
      toast.success('Record updated successfully')
      cancelEdit()
    } else {
      toast.error(error || 'Failed to update record')
    }
    setIsSaving(false)
  }

  const toggleExpand = (recordId: string) => {
    setExpandedRecord(prev => prev === recordId ? null : recordId)
  }

  return {
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
  }
}
