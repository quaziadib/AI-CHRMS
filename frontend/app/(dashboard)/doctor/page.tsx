'use client'

import Link from 'next/link'
import { Stethoscope, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccessRequests } from '@/features/doctor/components/access-requests'
import { useDoctorPatients } from '@/features/doctor/hooks/use-doctor-patients'

export default function DoctorDashboardPage() {
  const { patients, isLoading } = useDoctorPatients()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50">
          <Stethoscope className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doctor Dashboard</h1>
          <p className="text-muted-foreground">
            Review access requests, then browse your patient list from the Patients tab.
          </p>
        </div>
      </div>

      <AccessRequests />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {isLoading ? (
            <span>Loading patient count…</span>
          ) : (
            <span>
              {patients.length} patient{patients.length !== 1 ? 's' : ''} with active access
            </span>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/doctor/patients">View all patients</Link>
        </Button>
      </div>
    </div>
  )
}
