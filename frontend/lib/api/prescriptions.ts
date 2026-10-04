import { api } from './client'
import type { ApiResponse } from './types'
import type {
  PrescriptionCreate,
  PrescriptionUpdate,
  PrescriptionResponse,
  PrescriptionListItem,
} from './types'

export const prescriptionsApi = {
  // Doctor endpoints
  doctorCreate: (patientId: string, data: PrescriptionCreate) =>
    api.post<PrescriptionResponse>(`/doctor/patients/${patientId}/prescriptions`, data),

  doctorList: (patientId: string) =>
    api.get<PrescriptionListItem[]>(`/doctor/patients/${patientId}/prescriptions`),

  doctorGet: (patientId: string, prescriptionId: string) =>
    api.get<PrescriptionResponse>(`/doctor/patients/${patientId}/prescriptions/${prescriptionId}`),

  doctorUpdate: (patientId: string, prescriptionId: string, data: PrescriptionUpdate) =>
    api.patch<PrescriptionResponse>(`/doctor/patients/${patientId}/prescriptions/${prescriptionId}`, data),

  // Patient endpoints
  patientList: () =>
    api.get<PrescriptionListItem[]>('/prescriptions'),

  patientGet: (prescriptionId: string) =>
    api.get<PrescriptionResponse>(`/prescriptions/${prescriptionId}`),

  patientDownloadPdf: async (prescriptionId: string): Promise<void> => {
    const token = api.getAccessToken()
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(`/v1/prescriptions/${prescriptionId}/pdf`, { headers })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.detail ?? 'Failed to download PDF')
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prescription-${prescriptionId.slice(0, 8)}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  },
}
