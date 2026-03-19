import { api } from './client'
import type { PatientRecord, PatientRecordCreate } from './types'

export const recordsApi = {
  list: (params?: { skip?: number; limit?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.set('skip', String(params.skip))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    const query = searchParams.toString()
    return api.get<PatientRecord[]>(`/records${query ? `?${query}` : ''}`)
  },
  get: (id: string) => api.get<PatientRecord>(`/records/${id}`),
  create: (data: PatientRecordCreate) => api.post<PatientRecord>('/records', data),
  update: (id: string, data: Partial<PatientRecordCreate>) =>
    api.patch<PatientRecord>(`/records/${id}`, data),
  delete: (id: string) => api.delete(`/records/${id}`),
}
