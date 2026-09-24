'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { useAdmin } from '@/features/admin/hooks/use-admin'
import { StatsCards } from '@/features/admin/components/stats-cards'
import { UsersTab } from '@/features/admin/components/users-tab'
import { RecordsTab } from '@/features/admin/components/records-tab'
import { SettingsTab } from '@/features/admin/components/settings-tab'
import { AccessHistoryTab } from '@/features/admin/components/access-history-tab'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Users, FileText, Search, Download, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api'
import type { SystemSettings } from '@/lib/api'

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'users' | 'records' | 'access' | 'settings'>('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)

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
    doctors,
    records,
    isLoading,
    stats,
    handleRoleChange,
    handleStatusChange,
    handleAssignDoctor,
    downloadCSV,
  } = useAdmin()

  useEffect(() => {
    if (isAdmin) {
      adminApi.getSettings().then(({ data }) => {
        if (data) setSystemSettings(data)
      })
    }
  }, [isAdmin])

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

      <StatsCards stats={stats} isLoading={isLoading} />

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
        <Button
          variant={activeTab === 'access' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('access')}
          className="rounded-b-none"
        >
          Patient Access History
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('settings')}
          className="rounded-b-none"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {activeTab !== 'settings' && (
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === 'users' ? 'Search users by name or email...' : activeTab === 'access' ? 'Search by patient, doctor, actor, or event...' : 'Search by user name, email, or PID...'}
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
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
      ) : activeTab === 'settings' ? (
        <SettingsTab settings={systemSettings} onUpdated={setSystemSettings} />
      ) : activeTab === 'users' ? (
        <UsersTab
          users={users}
          isLoading={isLoading}
          currentUserId={user.id}
          onRoleChange={handleRoleChange}
          onStatusChange={handleStatusChange}
          searchQuery={searchTerm}
        />
      ) : activeTab === 'records' ? (
        <RecordsTab
          records={records}
          users={users}
          doctors={doctors}
          isLoading={isLoading}
          searchQuery={searchTerm}
          onAssignDoctor={handleAssignDoctor}
        />
      ) : (
        <AccessHistoryTab searchQuery={searchTerm} />
      )}
    </div>
  )
}
