import { api } from './client'
import type { Patient, PatientCreate } from './types'

export const patientsApi = {
  create: (data: PatientCreate) =>
    api.post<Patient>('/collector/patients', data),

  list: (params?: { skip?: number; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.skip) q.set('skip', String(params.skip))
    if (params?.limit) q.set('limit', String(params.limit))
    const qs = q.toString()
    return api.get<Patient[]>(`/collector/patients${qs ? `?${qs}` : ''}`)
  },

  update: (id: string, data: Partial<PatientCreate>) =>
    api.patch<Patient>(`/collector/patients/${id}`, data),
}
