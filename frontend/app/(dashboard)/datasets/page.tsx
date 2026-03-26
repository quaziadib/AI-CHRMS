'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Database, Plus, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { datasetsApi, type DatasetSubmission } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { formatDate } from '@/lib/utils'

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  approved: 'default',
  processing: 'secondary',
  published: 'default',
  rejected: 'destructive',
}

export default function DatasetsPage() {
  const { isAdmin } = useAuth()
  const [datasets, setDatasets] = useState<DatasetSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [acting, setActing] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', file_url: '', record_count: '' })

  useEffect(() => {
    datasetsApi.list().then(({ data }) => {
      if (data) setDatasets(data)
    }).finally(() => setIsLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { data, error } = await datasetsApi.submit({
      title: form.title,
      description: form.description,
      file_url: form.file_url || undefined,
      record_count: form.record_count ? Number(form.record_count) : undefined,
    })
    if (data) {
      setDatasets(prev => [data, ...prev])
      setShowForm(false)
      setForm({ title: '', description: '', file_url: '', record_count: '' })
      toast.success('Dataset submitted for review')
    } else {
      toast.error(error || 'Submission failed')
    }
    setSubmitting(false)
  }

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    setActing(id)
    const fn = action === 'approve' ? datasetsApi.approve : datasetsApi.reject
    const { data, error } = await fn(id)
    if (data) {
      setDatasets(prev => prev.map(d => d.id === id ? data : d))
      toast.success(`Dataset ${action}d`)
    } else {
      toast.error(error || `Failed to ${action}`)
    }
    setActing(null)
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Datasets</h1>
          <p className="text-muted-foreground">{datasets.length} submission{datasets.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Submit Dataset
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Submit a Dataset</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input required value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>File URL (optional)</Label>
                  <Input value={form.file_url}
                    onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Record Count (optional)</Label>
                  <Input type="number" value={form.record_count}
                    onChange={e => setForm(f => ({ ...f, record_count: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Spinner size="sm" className="mr-2" />}
                  Submit
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {datasets.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No datasets submitted yet.</p>
          </div>
        ) : datasets.map(d => (
          <Card key={d.id}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{d.title}</h3>
                    <Badge variant={STATUS_BADGE[d.status] ?? 'outline'}>
                      {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{d.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Submitted {formatDate(d.created_at)}
                    {d.record_count ? ` · ${d.record_count} records` : ''}
                  </p>
                  {d.admin_notes && (
                    <p className="text-xs text-muted-foreground italic">Admin: {d.admin_notes}</p>
                  )}
                </div>

                {isAdmin && d.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleReview(d.id, 'approve')} disabled={acting === d.id}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReview(d.id, 'reject')} disabled={acting === d.id}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
