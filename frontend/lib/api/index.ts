export { api } from './client'
export { authApi } from './auth'
export { usersApi } from './users'
export { recordsApi } from './records'
export { adminApi } from './admin'
export { doctorApi } from './doctor'
export { nationalApi } from './national'
export type {
  User, PatientRecord, PatientRecordCreate, AuditLog, AdminStats, ApiResponse,
  RecommendationsOutput, RecommendationCategories, ResubmitStatus, HealthTrends,
  SystemSettings, PersonalizedPlan, ForecastJob, ForecastPoint, ForecastResult,
} from './types'
