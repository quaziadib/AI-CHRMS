'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserPlus, Users, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { copiApi, type User } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'

export default function CollectorsPage() {
  const { isCoPi, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [collectors, setCollectors] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', password: '', phone: '' })

  useEffect(() => {
    if (!authLoading && !isCoPi) router.replace('/dashboard')
  }, [authLoading, isCoPi, router])

  useEffect(() => {
    copiApi.listCollectors().then(({ data }) => {
      if (data) setCollectors(data)
    }).finally(() => setIsLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { data, error } = await copiApi.createCollector(form)
    if (data) {
      setCollectors(prev => [data, ...prev])
      setShowForm(false)
      setForm({ email: '', full_name: '', password: '', phone: '' })
      toast.success('Data Collector account created')
    } else {
      toast.error(error || 'Failed to create account')
    }
    setSubmitting(false)
  }

  const handleToggle = async (collector: User) => {
    const fn = collector.is_active ? copiApi.deactivate : copiApi.activate
    const { data, error } = await fn(collector.id)
    if (data) {
      setCollectors(prev => prev.map(c => c.id === collector.id ? data : c))
      toast.success(`Account ${collector.is_active ? 'deactivated' : 'activated'}`)
    } else {
      toast.error(error || 'Failed to update account')
    }
  }

  if (authLoading || isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Collectors</h1>
          <p className="text-muted-foreground">{collectors.length} collector{collectors.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Collector
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create Data Collector Account</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input required value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input required type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input required type="password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Spinner size="sm" className="mr-2" />}
                  Create
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {collectors.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No data collectors yet.</p>
          </div>
        ) : collectors.map(c => (
          <Card key={c.id}>
            <CardContent className="pt-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{c.full_name}</div>
                <div className="text-sm text-muted-foreground truncate">{c.email}</div>
                <Badge variant={c.is_active ? 'default' : 'secondary'} className="mt-2">
                  {c.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggle(c)}
                className="shrink-0"
              >
                {c.is_active
                  ? <XCircle className="h-4 w-4 text-destructive" />
                  : <CheckCircle className="h-4 w-4 text-green-600" />}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
