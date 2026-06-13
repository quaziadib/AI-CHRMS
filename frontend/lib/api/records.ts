import { api } from './client'
import type { ForecastJob, HealthTrends, PatientRecord, PatientRecordCreate, ResubmitStatus } from './types'

export const recordsApi = {
  getResubmitStatus: () => api.get<ResubmitStatus>('/records/resubmit-status'),
  getHealthTrends: () => api.get<HealthTrends>('/records/history/trends'),
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
  scoreRisk: (id: string) => api.post<PatientRecord>(`/records/${id}/risk-score`, {}),
  scoreRecommendations: (id: string) => api.post<PatientRecord>(`/records/${id}/recommendations`, {}),
  generatePlan: (id: string) => api.post<PatientRecord>(`/records/${id}/personalized-plan`, {}),
  startForecast: (id: string) => api.post<ForecastJob>(`/records/${id}/forecast`, {}),
  getLatestForecast: (id: string) => api.get<ForecastJob>(`/records/${id}/forecast/latest`),
  getForecast: (id: string, jobId: string) => api.get<ForecastJob>(`/records/${id}/forecast/${jobId}`),
}
