'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { User } from '@/lib/api'
import { Check, X, UserRound } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  doctor: 'Doctor',
  national_admin: 'National Admin',
  admin: 'Admin',
  user: 'Patient',
}

interface Props {
  requests: User[]
  isLoading: boolean
  onApprove: (userId: string) => void
  onReject: (userId: string) => void
}

export function RoleRequestsTab({ requests, isLoading, onApprove, onReject }: Props) {
  if (isLoading) return null

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <UserRound className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No pending role requests</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((u) => (
        <Card key={u.id}>
          <CardHeader className="py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">{u.full_name}</CardTitle>
                <CardDescription>{u.email}</CardDescription>
                <p className="mt-1 text-sm">
                  Requested:{' '}
                  <span className="font-medium">
                    {ROLE_LABELS[u.requested_role ?? ''] ?? u.requested_role}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onApprove(u.id)} className="gap-1">
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReject(u.id)} className="gap-1">
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
