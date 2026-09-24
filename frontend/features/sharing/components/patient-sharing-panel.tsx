'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { sharingApi } from '@/lib/api'
import type { DoctorInteraction, DoctorOption, PatientGrant, PatientMedication } from '@/lib/api'

export function PatientSharingPanel() {
  const { data, isLoading, mutate } = useSWR('patient-sharing-profile', async () => {
    const [doctorsRes, grantsRes, medicationRes, interactionRes] = await Promise.all([
      sharingApi.getDoctors(), sharingApi.getGrants(), sharingApi.getMedications(), sharingApi.getInteractions(),
    ])
    if (!doctorsRes.data || !grantsRes.data || !medicationRes.data || !interactionRes.data) {
      throw new Error(doctorsRes.error ?? grantsRes.error ?? medicationRes.error ?? interactionRes.error ?? 'Could not load patient profile history')
    }
    return { doctors: doctorsRes.data, grants: grantsRes.data, medications: medicationRes.data, interactions: interactionRes.data }
  })
  const [doctorId, setDoctorId] = useState('')
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [editing, setEditing] = useState<PatientMedication | null>(null)
  const doctors = data?.doctors ?? []
  const grants = data?.grants ?? []
  const medications = data?.medications ?? []
  const interactions = data?.interactions ?? []

  const grantAccess = async () => {
    if (!doctorId) return
    const { data, error } = await sharingApi.createGrant(doctorId)
    if (!data) {
      toast.error(error ?? 'Could not request doctor access')
      return
    }
    await mutate((current) => current ? { ...current, grants: [data, ...current.grants] } : current, false)
    setDoctorId('')
    toast.success('Request sent. The doctor must accept before seeing your profile.')
  }

  const revoke = async (grant: PatientGrant) => {
    const { data, error } = await sharingApi.revokeGrant(grant.id)
    if (!data) {
      toast.error(error ?? 'Could not revoke access')
      return
    }
    await mutate((current) => current ? { ...current, grants: current.grants.map((row) => row.id === grant.id ? data : row) } : current, false)
    toast.success('Doctor access revoked')
  }

  const clearMedicationForm = () => {
    setEditing(null)
    setName('')
    setDosage('')
    setStartDate('')
    setEndDate('')
  }

  const saveMedication = async (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      name: name.trim(),
      dosage: dosage.trim() || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }
    const result = editing
      ? await sharingApi.updateMedication(editing.id, payload)
      : await sharingApi.createMedication(payload)
    if (!result.data) {
      toast.error(result.error ?? 'Could not save medication history')
      return
    }
    await mutate((current) => current ? { ...current, medications: editing
      ? current.medications.map((item) => item.id === editing.id ? result.data! : item)
      : [result.data!, ...current.medications] } : current, false)
    clearMedicationForm()
    toast.success('Medication history saved')
  }

  const editMedication = (item: PatientMedication) => {
    setEditing(item)
    setName(item.name)
    setDosage(item.dosage ?? '')
    setStartDate(item.start_date ?? '')
    setEndDate(item.end_date ?? '')
  }

  const deleteMedication = async (item: PatientMedication) => {
    const { error } = await sharingApi.deleteMedication(item.id)
    if (error) {
      toast.error(error)
      return
    }
    await mutate((current) => current ? { ...current, medications: current.medications.filter((row) => row.id !== item.id) } : current, false)
    if (editing?.id === item.id) clearMedicationForm()
    toast.success('Medication entry removed')
  }

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Doctor access</CardTitle>
          <CardDescription>Only doctors you choose who accept your request can see your health profile. You can revoke access at any time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className="h-10 flex-1 rounded-md border bg-background px-3 text-sm" value={doctorId} onChange={(event) => setDoctorId(event.target.value)}>
              <option value="">Select a doctor</option>
              {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.full_name} · {doctor.email}</option>)}
            </select>
            <Button onClick={grantAccess} disabled={!doctorId}>Grant access</Button>
          </div>
          {grants.length === 0 ? <p className="text-sm text-muted-foreground">You have no doctor access requests.</p> : (
            <div className="divide-y rounded-md border">
              {grants.map((grant) => (
                <div key={grant.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div>
                    <p className="font-medium">{grant.doctor_name ?? 'Doctor'}</p>
                    <p className="text-sm text-muted-foreground">Request status: <span className="capitalize">{grant.status}</span></p>
                  </div>
                  {grant.status === 'active' && <Button variant="outline" size="sm" onClick={() => revoke(grant)}>Revoke access</Button>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medication history</CardTitle>
          <CardDescription>These entries are patient-reported history, not prescriptions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={saveMedication} className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Medication name" value={name} onChange={(event) => setName(event.target.value)} required />
            <Input placeholder="Dosage (optional)" value={dosage} onChange={(event) => setDosage(event.target.value)} />
            <label className="space-y-1 text-xs text-muted-foreground">Start date<Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <label className="space-y-1 text-xs text-muted-foreground">End date (leave empty if ongoing)<Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">{editing ? 'Save changes' : 'Add medication'}</Button>
              {editing && <Button type="button" variant="outline" onClick={clearMedicationForm}>Cancel</Button>}
            </div>
          </form>
          {medications.length === 0 ? <p className="text-sm text-muted-foreground">No medication history added yet.</p> : (
            <div className="divide-y rounded-md border">
              {medications.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                  <div><p className="font-medium">{item.name}{item.dosage ? ` · ${item.dosage}` : ''}</p><p className="text-sm text-muted-foreground">Patient-reported · {item.start_date ?? 'Start date not recorded'}{item.end_date ? ` to ${item.end_date}` : item.start_date ? ' · ongoing' : ''}</p></div>
                  <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => editMedication(item)}>Edit</Button><Button variant="ghost" size="sm" onClick={() => deleteMedication(item)}>Remove</Button></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Doctor interactions</CardTitle><CardDescription>Clinical interactions recorded by your doctors.</CardDescription></CardHeader>
        <CardContent>
          {interactions.length === 0 ? <p className="text-sm text-muted-foreground">No doctor interactions recorded yet.</p> : (
            <div className="space-y-3">{interactions.map((item) => <article key={item.id} className="rounded-md border p-3"><p className="text-sm font-medium">{item.doctor_name ?? 'Doctor'} · {new Date(item.interaction_at).toLocaleString()}</p><p className="mt-2 whitespace-pre-wrap text-sm">{item.note}</p></article>)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
