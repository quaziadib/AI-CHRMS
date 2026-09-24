export { api } from './client'
export { authApi } from './auth'
export { usersApi } from './users'
export { recordsApi } from './records'
export { adminApi } from './admin'
export { doctorApi } from './doctor'
export { sharingApi } from './sharing'
export { messagingApi } from './messaging'
export { nationalApi } from './national'
export type {
  User, PatientRecord, PatientRecordCreate, AuditLog, AdminStats, ApiResponse,
  RecommendationsOutput, RecommendationCategories, ResubmitStatus, HealthTrends,
  SystemSettings, PersonalizedPlan, ForecastJob,
  DoctorOption, PatientGrant, PatientGrantStatus, PatientMedication, DoctorInteraction,
  PatientAccessEvent, DoctorPatientProfile, DoctorPatientListItem,
  PatientDoctorMessage, PatientDoctorConversationSummary, PatientDoctorConversation, MessagingGrantStatus,
} from './types'
