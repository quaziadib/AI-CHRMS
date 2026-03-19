'use client'

import Link from 'next/link'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { LayoutDashboard } from 'lucide-react'

export function HomeNav() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <div className="h-9 w-48" />

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium leading-none">{user.full_name}</span>
          <span className="text-xs text-muted-foreground mt-0.5">{user.email}</span>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
          {user.full_name?.charAt(0).toUpperCase()}
        </div>
        <Link href={user.roles.includes('admin') ? '/admin' : '/records'}>
          <Button size="sm">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/login">
        <Button variant="ghost">Sign In</Button>
      </Link>
      <Link href="/register">
        <Button>Get Started</Button>
      </Link>
    </div>
  )
}
