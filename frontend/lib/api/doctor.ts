import { api } from './client'
import type { PatientRecord } from './types'

export const doctorApi = {
  getPatients: (params?: { risk_level?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.risk_level) searchParams.set('risk_level', params.risk_level)
    const query = searchParams.toString()
    return api.get<PatientRecord[]>(`/doctor/patients${query ? `?${query}` : ''}`)
  },
  getPatient: (recordId: string) =>
    api.get<PatientRecord>(`/doctor/patients/${recordId}`),
}
