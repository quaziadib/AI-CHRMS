'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { useAdmin } from '@/features/admin/hooks/use-admin'
import { StatsCards } from '@/features/admin/components/stats-cards'
import { UsersTab } from '@/features/admin/components/users-tab'
import { RecordsTab } from '@/features/admin/components/records-tab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Users, FileText, Search, Download } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'users' | 'records'>('users')
  const [searchTerm, setSearchTerm] = useState('')

  const isAdmin = user?.roles.includes('admin')

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!user.roles.includes('admin')) {
        router.push('/dashboard')
        toast.error('Access denied. Admin privileges required.')
      }
    }
  }, [user, authLoading, router])

  const {
    users,
    records,
    isLoading,
    stats,
    handleRoleChange,
    handleStatusChange,
    downloadCSV,
  } = useAdmin()

  if (authLoading || !user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users and view all health records</p>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} isLoading={isLoading} />

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('users')}
          className="rounded-b-none"
        >
          <Users className="h-4 w-4 mr-2" />
          Users ({users.length})
        </Button>
        <Button
          variant={activeTab === 'records' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('records')}
          className="rounded-b-none"
        >
          <FileText className="h-4 w-4 mr-2" />
          Records ({records.length})
        </Button>
      </div>

      {/* Search + CSV */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'users' ? 'Search users by name or email...' : 'Search by user name, email, or PID...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {activeTab === 'records' && records.length > 0 && (
          <Button variant="outline" onClick={downloadCSV} className="gap-2 shrink-0">
            <Download className="h-4 w-4" />
            Download CSV
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
      ) : activeTab === 'users' ? (
        <UsersTab
          users={users}
          isLoading={isLoading}
          currentUserId={user.id}
          onRoleChange={handleRoleChange}
          onStatusChange={handleStatusChange}
          searchQuery={searchTerm}
        />
      ) : (
        <RecordsTab
          records={records}
          users={users}
          isLoading={isLoading}
          searchQuery={searchTerm}
        />
      )}
    </div>
  )
}
