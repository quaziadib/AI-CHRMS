import { api } from './client'
import type { DatasetSubmission } from './types'

export const datasetsApi = {
  submit: (data: { title: string; description: string; file_url?: string; record_count?: number }) =>
    api.post<DatasetSubmission>('/datasets', data),

  list: (params?: { status?: string; skip?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.skip) q.set('skip', String(params.skip))
    if (params?.limit) q.set('limit', String(params.limit))
    const qs = q.toString()
    return api.get<DatasetSubmission[]>(`/datasets${qs ? `?${qs}` : ''}`)
  },

  get: (id: string) => api.get<DatasetSubmission>(`/datasets/${id}`),

  approve: (id: string, notes?: string) =>
    api.post<DatasetSubmission>(`/datasets/${id}/approve`, { admin_notes: notes }),

  reject: (id: string, notes?: string) =>
    api.post<DatasetSubmission>(`/datasets/${id}/reject`, { admin_notes: notes }),
}
