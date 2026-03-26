export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  is_active: boolean
  is_verified: boolean
  roles: string[]
  created_at: string
  updated_at: string
}

export interface PatientRecord {
  id: string
  user_id: string
  pid: string
  // Demographics
  age: number
  gender: string
  district: string
  // Family History
  family_diabetes: boolean
  family_hypertension: boolean
  family_cvd: boolean
  family_stroke: boolean
  // Medical History
  diabetes_history: boolean
  hypertension: boolean
  cvd: boolean
  stroke: boolean
  allergies?: string
  pregnancies?: number
  // Vital Signs
  bp_systolic: number
  bp_diastolic: number
  height: number
  weight: number
  bmi: number
  pulse_rate: number
  // Lab Tests
  blood_glucose?: number
  cholesterol?: number
  hemoglobin?: number
  creatinine?: number
  ecg_result?: string
  // Clinical
  symptoms?: string
  diagnosis?: string
  // Lifestyle
  smoking: string
  physical_activity: string
  alcohol: string
  sleep_hours: number
  sound_sleep: boolean
  // Timestamps
  created_at: string
  updated_at: string
}

export interface PatientRecordCreate {
  age: number
  gender: string
  district: string
  family_diabetes: boolean
  family_hypertension: boolean
  family_cvd: boolean
  family_stroke: boolean
  diabetes_history: boolean
  hypertension: boolean
  cvd: boolean
  stroke: boolean
  allergies?: string
  pregnancies?: number
  bp_systolic: number
  bp_diastolic: number
  height: number
  weight: number
  bmi: number
  pulse_rate: number
  blood_glucose?: number
  cholesterol?: number
  hemoglobin?: number
  creatinine?: number
  ecg_result?: string
  symptoms?: string
  diagnosis?: string
  smoking: string
  physical_activity: string
  alcohol: string
  sleep_hours: number
  sound_sleep: boolean
}

export interface AuditLog {
  id: string
  user_id: string
  user_email?: string
  action: string
  entity_type: string
  entity_id?: string
  ip_address?: string
  user_agent?: string
  status: string
  timestamp: string
}

export interface AdminStats {
  total_users: number
  active_users: number
  total_records: number
  records_today: number
  records_this_week: number
  records_this_month: number
}

// ── New types for v2 ──────────────────────────────────────────────────────────

export interface Patient {
  id: string
  user_id: string | null
  created_by: string
  full_name: string
  phone?: string
  date_of_birth?: string
  district?: string
  address?: string
  created_at?: string
  updated_at?: string
}

export interface PatientCreate {
  full_name: string
  phone?: string
  date_of_birth?: string
  district?: string
  address?: string
  nid?: string
  create_account?: boolean
  account_email?: string
}

export interface ConsentRequest {
  id: string
  patient_id: string
  requester_id: string
  requester_role: string
  purpose: string
  status: 'pending' | 'approved' | 'rejected' | 'revoked'
  reviewed_at?: string
  reviewed_by?: string
  expires_at?: string
  notes?: string
  created_at: string
}

export interface DatasetSubmission {
  id: string
  submitted_by: string
  title: string
  description: string
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'published'
  file_url?: string
  record_count?: number
  reviewed_at?: string
  reviewed_by?: string
  admin_notes?: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  disclaimer?: string
}
