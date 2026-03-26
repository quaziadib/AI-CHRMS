import { api } from './client'
import type { User } from './types'

export const copiApi = {
  listCollectors: (params?: { skip?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.skip) q.set('skip', String(params.skip))
    if (params?.limit) q.set('limit', String(params.limit))
    const qs = q.toString()
    return api.get<User[]>(`/copi/collectors${qs ? `?${qs}` : ''}`)
  },

  createCollector: (data: { email: string; full_name: string; password: string; phone?: string }) =>
    api.post<User>('/copi/collectors', data),

  deactivate: (id: string) => api.patch<User>(`/copi/collectors/${id}/deactivate`, {}),

  activate: (id: string) => api.patch<User>(`/copi/collectors/${id}/activate`, {}),
}
