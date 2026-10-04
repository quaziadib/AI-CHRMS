'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { DoctorPicker } from '@/features/sharing/components/doctor-picker'
import { sharingApi } from '@/lib/api'
import type { PatientGrant } from '@/lib/api'

export function PatientSharingPanel() {
  const { data, isLoading, mutate } = useSWR('patient-sharing-profile', async () => {
    const grantsRes = await sharingApi.getGrants()
    if (!grantsRes.data) {
      throw new Error(grantsRes.error ?? 'Could not load doctor access')
    }
    return { grants: grantsRes.data }
  })
  const [doctorId, setDoctorId] = useState('')
  const grants = data?.grants ?? []

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

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Doctor access</CardTitle>
          <CardDescription>Only doctors you choose who accept your request can see your health profile. You can revoke access at any time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DoctorPicker selectedId={doctorId} onSelect={setDoctorId} />
          <Button onClick={grantAccess} disabled={!doctorId}>Grant access</Button>
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
    </div>
  )
}
