'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserPlus, Users, Phone, MapPin, Calendar } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { patientsApi, type Patient } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

export default function PatientsPage() {
  const { isCollector, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    district: '',
    date_of_birth: '',
    address: '',
    nid: '',
    create_account: false,
    account_email: '',
  })

  useEffect(() => {
    if (!authLoading && !isCollector) {
      router.replace('/dashboard')
    }
  }, [authLoading, isCollector, router])

  useEffect(() => {
    patientsApi.list().then(({ data }) => {
      if (data) setPatients(data)
    }).finally(() => setIsLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const payload = {
      full_name: form.full_name,
      phone: form.phone || undefined,
      district: form.district || undefined,
      date_of_birth: form.date_of_birth || undefined,
      address: form.address || undefined,
      nid: form.nid || undefined,
      create_account: form.create_account,
      account_email: form.create_account ? form.account_email : undefined,
    }
    const { data, error } = await patientsApi.create(payload)
    if (data) {
      setPatients(prev => [data, ...prev])
      setShowForm(false)
      setForm({ full_name: '', phone: '', district: '', date_of_birth: '', address: '', nid: '', create_account: false, account_email: '' })
      toast.success('Patient registered successfully')
    } else {
      toast.error(error || 'Failed to register patient')
    }
    setSubmitting(false)
  }

  if (authLoading || isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-muted-foreground">{patients.length} patient{patients.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Register Patient
        </Button>
      </div>

      {/* Registration form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Register New Patient</CardTitle>
            <CardDescription>NID is hashed before storage and never shown again.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input id="full_name" required value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input id="district" value={form.district}
                  onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input id="date_of_birth" type="date" value={form.date_of_birth}
                  onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nid">National ID (will be hashed)</Label>
                <Input id="nid" value={form.nid}
                  onChange={e => setForm(f => ({ ...f, nid: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.create_account}
                    onChange={e => setForm(f => ({ ...f, create_account: e.target.checked }))} />
                  Create system account for patient
                </Label>
                {form.create_account && (
                  <Input placeholder="Patient email" value={form.account_email}
                    onChange={e => setForm(f => ({ ...f, account_email: e.target.value }))} />
                )}
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Spinner size="sm" className="mr-2" /> : null}
                  Register
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Patient list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {patients.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No patients registered yet.</p>
          </div>
        ) : patients.map(p => (
          <Card key={p.id}>
            <CardContent className="pt-5 space-y-2">
              <div className="font-semibold text-base">{p.full_name}</div>
              {p.phone && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {p.phone}
                </div>
              )}
              {p.district && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {p.district}
                </div>
              )}
              {p.date_of_birth && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> {p.date_of_birth}
                </div>
              )}
              <div className="text-xs text-muted-foreground pt-1">
                {p.user_id ? '✓ Has system account' : 'No system account'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
