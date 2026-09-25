import { api } from './client'
import type { DoctorInteraction, DoctorPatientListItem, DoctorPatientProfile, PatientGrant, PatientRecord } from './types'

export const doctorApi = {
  getPatients: (params?: { risk_level?: string; district?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.risk_level) searchParams.set('risk_level', params.risk_level)
    if (params?.district) searchParams.set('district', params.district)
    const query = searchParams.toString()
    return api.get<DoctorPatientListItem[]>(`/doctor/patients${query ? `?${query}` : ''}`)
  },
  getPatient: (patientId: string) =>
    api.get<DoctorPatientProfile>(`/doctor/patients/${patientId}`),
  summarize: (patientId: string) =>
    api.post<PatientRecord>(`/doctor/patients/${patientId}/summarize`),
  getAccessRequests: () => api.get<PatientGrant[]>('/doctor/access-requests'),
  respondToAccessRequest: (grantId: string, decision: 'accept' | 'decline') =>
    api.post<PatientGrant>(`/doctor/access-requests/${grantId}/respond`, { decision }),
  addInteraction: (patientId: string, note: string) =>
    api.post<DoctorInteraction>(`/doctor/patients/${patientId}/interactions`, { note }),
}
