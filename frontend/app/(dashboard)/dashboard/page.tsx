'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, homeRouteFor } from '@/components/auth/auth-provider'
import { Spinner } from '@/components/ui/spinner'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(homeRouteFor(user))
    }
  }, [user, isLoading, router])

  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size="lg" />
    </div>
  )
}
