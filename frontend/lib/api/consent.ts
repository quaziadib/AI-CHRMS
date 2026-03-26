import { api } from './client'
import type { ConsentRequest } from './types'

export const consentApi = {
  request: (data: { patient_id: string; purpose: string; expires_at?: string }) =>
    api.post<ConsentRequest>('/consent', data),

  myRequests: (params?: { status?: string; skip?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.skip) q.set('skip', String(params.skip))
    if (params?.limit) q.set('limit', String(params.limit))
    const qs = q.toString()
    return api.get<ConsentRequest[]>(`/consent/my-requests${qs ? `?${qs}` : ''}`)
  },

  myConsents: (params?: { status?: string; skip?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.skip) q.set('skip', String(params.skip))
    if (params?.limit) q.set('limit', String(params.limit))
    const qs = q.toString()
    return api.get<ConsentRequest[]>(`/consent/my-consents${qs ? `?${qs}` : ''}`)
  },

  approve: (id: string, notes?: string) =>
    api.post<ConsentRequest>(`/consent/${id}/approve`, { notes }),

  reject: (id: string, notes?: string) =>
    api.post<ConsentRequest>(`/consent/${id}/reject`, { notes }),

  listAll: (params?: { patient_id?: string; status?: string; skip?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.patient_id) q.set('patient_id', params.patient_id)
    if (params?.status) q.set('status', params.status)
    if (params?.skip) q.set('skip', String(params.skip))
    if (params?.limit) q.set('limit', String(params.limit))
    const qs = q.toString()
    return api.get<ConsentRequest[]>(`/consent${qs ? `?${qs}` : ''}`)
  },
}
