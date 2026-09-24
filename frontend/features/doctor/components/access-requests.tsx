'use client'

import useSWR, { useSWRConfig } from 'swr'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { doctorApi } from '@/lib/api'
import type { PatientGrant } from '@/lib/api'

export function AccessRequests() {
  const { mutate: globalMutate } = useSWRConfig()
  const { data: requests = [], mutate } = useSWR<PatientGrant[]>('/doctor/access-requests', async () => {
    const { data, error } = await doctorApi.getAccessRequests()
    if (!data) throw new Error(error ?? 'Could not load access requests')
    return data
  })

  const respond = async (request: PatientGrant, decision: 'accept' | 'decline') => {
    const { data, error } = await doctorApi.respondToAccessRequest(request.id, decision)
    if (!data) {
      toast.error(error ?? 'Could not update access request')
      return
    }
    await mutate(requests.filter((row) => row.id !== request.id), false)
    if (decision === 'accept') {
      await globalMutate((key) => typeof key === 'string' && key.startsWith('/doctor/patients'))
    }
    toast.success(decision === 'accept' ? 'Patient profile access accepted' : 'Request declined')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient access requests</CardTitle>
        <CardDescription>Patients must grant access, and you must accept before viewing their health profile.</CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? <p className="text-sm text-muted-foreground">No pending requests.</p> : (
          <div className="divide-y rounded-md border">
            {requests.map((request) => (
              <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div><p className="font-medium">{request.patient_name ?? 'Patient'}</p><p className="text-xs text-muted-foreground">Requested {new Date(request.created_at).toLocaleDateString()}</p></div>
                <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => respond(request, 'decline')}>Decline</Button><Button size="sm" onClick={() => respond(request, 'accept')}>Accept</Button></div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
