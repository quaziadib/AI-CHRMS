import { api } from './client'
import type {
  DoctorInteraction,
  DoctorOption,
  PatientGrant,
  PatientMedication,
} from './types'

export const sharingApi = {
  getDoctors: () => api.get<DoctorOption[]>('/sharing/doctors'),
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
