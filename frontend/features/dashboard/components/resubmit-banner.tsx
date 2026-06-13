'use client'

import Link from 'next/link'
import { AlertCircle, CalendarClock, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ResubmitStatus } from '@/lib/api'

interface ResubmitBannerProps {
  status: ResubmitStatus
}

export function ResubmitBanner({ status }: ResubmitBannerProps) {
  if (status.status === 'initial') {
    return (
      <Card className="border-dashed border-primary/40 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Complete your first health assessment
          </CardTitle>
          <CardDescription>
            Submit your health form to unlock risk scoring, personalized plans, and trend tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/health-form">Start Health Form</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'due') {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-amber-900">
            <RefreshCw className="h-5 w-5" />
            Resubmit due
          </CardTitle>
          <CardDescription className="text-amber-800">
            It has been {status.interval_months} month{status.interval_months === 1 ? '' : 's'} since your last
            assessment. Please resubmit to keep your health profile current. Previous submissions are kept on file.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="gap-2">
            <Link href="/health-form">
              <RefreshCw className="h-4 w-4" />
              Resubmit Health Assessment
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (status.status === 'upcoming') {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="py-4 flex items-center gap-3 text-sm text-blue-900">
          <CalendarClock className="h-5 w-5 shrink-0" />
          <span>
            Resubmit opens in <strong>{status.days_until_due}</strong> day
            {status.days_until_due === 1 ? '' : 's'} (
            {status.next_due_at ? new Date(status.next_due_at).toLocaleDateString('en-GB') : '—'}).
            You have <strong>{status.submission_count}</strong> submission
            {status.submission_count === 1 ? '' : 's'} on file.
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="py-4 flex items-center gap-3 text-sm text-muted-foreground">
        <CalendarClock className="h-5 w-5 shrink-0 text-primary" />
        <span>
          Next resubmit due{' '}
          <strong>{status.next_due_at ? new Date(status.next_due_at).toLocaleDateString('en-GB') : '—'}</strong>
          {' '}({status.interval_months}-month interval).{' '}
          {status.submission_count} historical submission{status.submission_count === 1 ? '' : 's'} stored.
        </span>
      </CardContent>
    </Card>
  )
}
