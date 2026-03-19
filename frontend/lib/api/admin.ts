import { api } from './client'
import type { User, PatientRecord, AuditLog, AdminStats } from './types'

export const adminApi = {
  getUsers: (params?: { skip?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.set('skip', String(params.skip))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.search) searchParams.set('search', params.search)
    const query = searchParams.toString()
    return api.get<User[]>(`/admin/users${query ? `?${query}` : ''}`)
  },
  getUser: (id: string) => api.get<User>(`/admin/users/${id}`),
  updateUser: (id: string, data: Partial<User>) =>
    api.patch<User>(`/admin/users/${id}`, data),
  getAllRecords: (params?: { skip?: number; limit?: number; user_id?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.set('skip', String(params.skip))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.user_id) searchParams.set('user_id', params.user_id)
    const query = searchParams.toString()
    return api.get<PatientRecord[]>(`/admin/records${query ? `?${query}` : ''}`)
  },
  getAuditLogs: (params?: {
    skip?: number
    limit?: number
    user_id?: string
    action?: string
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.set('skip', String(params.skip))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.user_id) searchParams.set('user_id', params.user_id)
    if (params?.action) searchParams.set('action', params.action)
    const query = searchParams.toString()
    return api.get<AuditLog[]>(`/admin/audit-logs${query ? `?${query}` : ''}`)
  },
  getStats: () => api.get<AdminStats>('/admin/stats'),
}
