'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Handshake, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { consentApi, type ConsentRequest } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { formatDate } from '@/lib/utils'

const STATUS_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  approved: 'default',
  rejected: 'destructive',
  revoked: 'secondary',
}

export default function ConsentPage() {
  const { user, isPatient } = useAuth()
  const [requests, setRequests] = useState<ConsentRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  useEffect(() => {
    const fn = isPatient ? consentApi.myConsents : consentApi.myRequests
    fn().then(({ data }) => {
      if (data) setRequests(data)
    }).finally(() => setIsLoading(false))
  }, [isPatient])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActing(id)
    const fn = action === 'approve' ? consentApi.approve : consentApi.reject
    const { data, error } = await fn(id)
    if (data) {
      setRequests(prev => prev.map(r => r.id === id ? data : r))
      toast.success(`Request ${action}d`)
    } else {
      toast.error(error || `Failed to ${action} request`)
    }
    setActing(null)
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  const title = isPatient ? 'Consent Requests About Me' : 'My Data Access Requests'
  const empty = isPatient
    ? 'No consent requests have been made for your data.'
    : 'You have not requested access to any patient data.'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{requests.length} request{requests.length !== 1 ? 's' : ''}</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Handshake className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <Card key={r.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_BADGE[r.status] ?? 'outline'}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{r.requester_role}</span>
                    </div>
                    <p className="text-sm font-medium">{r.purpose}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(r.created_at)}
                    </p>
                    {r.notes && (
                      <p className="text-xs text-muted-foreground italic">Note: {r.notes}</p>
                    )}
                  </div>

                  {isPatient && r.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleAction(r.id, 'approve')}
                        disabled={acting === r.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(r.id, 'reject')}
                        disabled={acting === r.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
