export { api } from './client'
export { authApi } from './auth'
export { usersApi } from './users'
export { recordsApi } from './records'
export { adminApi } from './admin'
export { patientsApi } from './patients'
export { consentApi } from './consent'
export { datasetsApi } from './datasets'
export { chatApi } from './chat'
export { mlApi } from './ml'
export { copiApi } from './copi'
export type {
  User,
  PatientRecord,
  PatientRecordCreate,
  AuditLog,
  AdminStats,
  ApiResponse,
  Patient,
  PatientCreate,
  ConsentRequest,
  DatasetSubmission,
  ChatMessage,
} from './types'
