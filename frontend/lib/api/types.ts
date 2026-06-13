export interface AbnormalityFlag {
  field: string
  label: string
  value: number
  unit: string
  severity: 'warning' | 'critical'
  reference: string
}

export interface RecommendationCategories {
  diet: string[]
  exercise: string[]
  lifestyle: string[]
  monitoring: string[]
}

export interface RecommendationsOutput {
  summary: string
  categories: RecommendationCategories
}

export interface MealDay {
  day: string
  breakfast: string
  lunch: string
  dinner: string
  snack: string
}

export interface ExerciseDay {
  day: string
  activity: string
  duration_minutes: number
  notes: string
}

export interface PersonalizedPlan {
  meal_plan_summary: string
  meals: MealDay[]
  exercise_summary: string
  exercises: ExerciseDay[]
}

export interface ForecastPoint {
  date: string
  glucose_mg_dl: number
  kind: 'actual' | 'forecast'
}

export interface ForecastResult {
  model: string
  summary: string
  points: ForecastPoint[]
}

export interface ForecastJob {
  id: string
  record_id: string
  user_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: ForecastResult
  error_message?: string
  created_at: string
  completed_at?: string
}

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
  role: string
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
  // Risk Assessment
  risk_level?: 'low' | 'moderate' | 'high'
  risk_explanation?: string
  recommendations?: RecommendationsOutput | string[]
  risk_scored_at?: string
  // Doctor assignment
  doctor_id?: string
  doctor_name?: string
  patient_name?: string
  ehr_summary?: string
  ehr_summary_at?: string
  flags?: AbnormalityFlag[]
  personalized_plan?: PersonalizedPlan
  personalized_plan_at?: string
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

export interface SystemSettings {
  resubmit_interval_months: number
  updated_at: string
  updated_by?: string
}

export interface ResubmitStatus {
  interval_months: number
  latest_submission_at?: string
  next_due_at?: string
  is_due: boolean
  days_until_due?: number
  submission_count: number
  can_submit_new: boolean
  status: 'initial' | 'current' | 'upcoming' | 'due'
}

export interface HealthTrendPoint {
  record_id: string
  pid: string
  submitted_at: string
  blood_glucose?: number
  bmi: number
  bp_systolic: number
  bp_diastolic: number
  risk_level?: string
  risk_score?: number
}

export interface HealthTrends {
  submissions: HealthTrendPoint[]
}
