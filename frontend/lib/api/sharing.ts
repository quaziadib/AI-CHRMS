import { api } from './client'
import type {
  DoctorInteraction,
  DoctorFilterOptions,
  DoctorSearchParams,
  DoctorSearchResponse,
  PatientGrant,
  PatientMedication,
} from './types'

export const sharingApi = {
  searchDoctors: (params: DoctorSearchParams = {}) => {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') query.set(key, String(value))
    }
    const qs = query.toString()
    return api.get<DoctorSearchResponse>(`/sharing/doctors${qs ? `?${qs}` : ''}`)
  },
  getDoctorFilters: () => api.get<DoctorFilterOptions>('/sharing/doctors/filters'),
  getGrants: () => api.get<PatientGrant[]>('/sharing/grants'),
  createGrant: (doctor_id: string) => api.post<PatientGrant>('/sharing/grants', { doctor_id }),
  revokeGrant: (grantId: string) => api.delete<PatientGrant>(`/sharing/grants/${grantId}`),
  getMedications: () => api.get<PatientMedication[]>('/sharing/medications'),
  createMedication: (data: Omit<PatientMedication, 'id' | 'patient_id' | 'created_at' | 'updated_at'>) =>
    api.post<PatientMedication>('/sharing/medications', data),
  updateMedication: (id: string, data: Omit<PatientMedication, 'id' | 'patient_id' | 'created_at' | 'updated_at'>) =>
    api.patch<PatientMedication>(`/sharing/medications/${id}`, data),
  deleteMedication: (id: string) => api.delete(`/sharing/medications/${id}`),
  getInteractions: () => api.get<DoctorInteraction[]>('/sharing/interactions'),
}
