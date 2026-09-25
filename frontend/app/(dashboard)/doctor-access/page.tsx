'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Stethoscope } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { Spinner } from '@/components/ui/spinner'
import { PatientSharingPanel } from '@/features/sharing/components/patient-sharing-panel'

export default function DoctorAccessPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const isPatient =
    !!user &&
    user.roles.some((role) => role === 'user' || role === 'patient') &&
    !user.roles.some((role) => ['admin', 'doctor', 'national_admin'].includes(role))

  useEffect(() => {
    if (!isLoading && user && !isPatient) {
      router.replace('/profile')
    }
  }, [isLoading, user, isPatient, router])

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isPatient) {
    return null
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-blue-50 p-2">
          <Stethoscope className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doctor Access</h1>
          <p className="text-muted-foreground">
            Grant doctors access to your health profile, manage medications, and review clinical interactions.
          </p>
        </div>
      </div>

      <PatientSharingPanel />
    </div>
  )
}
