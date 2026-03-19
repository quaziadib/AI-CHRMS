'use client'

import { useState } from 'react'
import {
  Users,
  Shield,
  ChevronDown,
  ChevronUp,
  Calendar,
  Mail,
  User as UserIcon,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import type { User } from '@/lib/api'

interface Props {
  users: User[]
  isLoading: boolean
  currentUserId: string
  onRoleChange: (userId: string, newRole: 'user' | 'admin') => void
  onStatusChange: (userId: string, isActive: boolean) => void
  searchQuery: string
}

export function UsersTab({
  users,
  isLoading,
  currentUserId,
  onRoleChange,
  onStatusChange,
  searchQuery,
}: Props) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) return null

  if (filteredUsers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No users found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {filteredUsers.map((u) => (
        <Card key={u.id} className="overflow-hidden">
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors py-4"
            onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${u.roles.includes('admin') ? 'bg-primary/10' : 'bg-muted'}`}>
                  {u.roles.includes('admin') ? (
                    <Shield className="h-5 w-5 text-primary" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {u.full_name}
                    {!u.is_active && (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">Inactive</span>
                    )}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {u.email}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  u.roles.includes('admin') ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {u.roles.includes('admin') ? 'admin' : 'user'}
                </span>
                {expandedUser === u.id
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>

          {expandedUser === u.id && (
            <CardContent className="border-t bg-muted/20 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="text-sm font-mono">{u.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="text-sm flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(u.created_at)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Select
                    value={u.roles.includes('admin') ? 'admin' : 'user'}
                    onValueChange={(value) => onRoleChange(u.id, value as 'user' | 'admin')}
                    disabled={u.id === currentUserId}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Button
                    variant={u.is_active ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => onStatusChange(u.id, !u.is_active)}
                    disabled={u.id === currentUserId}
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
              {u.id === currentUserId && (
                <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  You cannot modify your own account from here
                </p>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  )
}
