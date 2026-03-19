import { z } from 'zod'

// Districts list (can be extended)
export const districts = [
  'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet', 
  'Rangpur', 'Barisal', 'Mymensingh', 'Comilla', 'Gazipur',
  'Narayanganj', 'Bogra', 'Cox\'s Bazar', 'Jessore', 'Dinajpur',
  'Other'
]

export const genderOptions = ['Male', 'Female', 'Other']

export const smokingOptions = [
  'Never',
  'Former (quit more than 1 year)',
  'Former (quit less than 1 year)',
  'Current (occasional)',
  'Current (daily)',
]

export const physicalActivityOptions = [
  'Sedentary (little to no exercise)',
  'Light (1-3 days/week)',
  'Moderate (3-5 days/week)',
  'Active (6-7 days/week)',
  'Very Active (intense exercise daily)',
]

export const alcoholOptions = [
  'Never',
  'Rarely (special occasions)',
  'Monthly',
  'Weekly',
  'Daily',
]

export const ecgResultOptions = [
  'Normal',
  'Abnormal - Minor',
  'Abnormal - Significant',
  'Not Done',
]

// Step 1: Demographics
export const demographicsSchema = z.object({
  age: z.coerce.number().min(0, 'Age must be positive').max(150, 'Please enter a valid age'),
  gender: z.string().min(1, 'Please select a gender'),
  district: z.string().min(1, 'Please select a district'),
})

// Step 2: Family History
export const familyHistorySchema = z.object({
  family_diabetes: z.boolean().default(false),
  family_hypertension: z.boolean().default(false),
  family_cvd: z.boolean().default(false),
  family_stroke: z.boolean().default(false),
})

// Step 3: Medical History
export const medicalHistorySchema = z.object({
  diabetes_history: z.boolean().default(false),
  hypertension: z.boolean().default(false),
  cvd: z.boolean().default(false),
  stroke: z.boolean().default(false),
  allergies: z.string().optional(),
  pregnancies: z.coerce.number().min(0).optional(),
})

// Step 4: Vital Signs
export const vitalSignsSchema = z.object({
  bp_systolic: z.coerce.number().min(50, 'Please enter a valid BP').max(300),
  bp_diastolic: z.coerce.number().min(30, 'Please enter a valid BP').max(200),
  height: z.coerce.number().min(30, 'Please enter a valid height').max(300),
  weight: z.coerce.number().min(1, 'Please enter a valid weight').max(500),
  bmi: z.coerce.number().min(5).max(100),
  pulse_rate: z.coerce.number().min(20, 'Please enter a valid pulse rate').max(250),
})

// Step 5: Lab Tests
export const labTestsSchema = z.object({
  blood_glucose: z.coerce.number().min(0).optional().or(z.literal('')),
  cholesterol: z.coerce.number().min(0).optional().or(z.literal('')),
  hemoglobin: z.coerce.number().min(0).optional().or(z.literal('')),
  creatinine: z.coerce.number().min(0).optional().or(z.literal('')),
  ecg_result: z.string().optional(),
})

// Step 6: Clinical Visit
export const clinicalVisitSchema = z.object({
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
})

// Step 7: Lifestyle
export const lifestyleSchema = z.object({
  smoking: z.string().min(1, 'Please select smoking status'),
  physical_activity: z.string().min(1, 'Please select activity level'),
  alcohol: z.string().min(1, 'Please select alcohol consumption'),
  sleep_hours: z.coerce.number().min(0).max(24, 'Please enter valid sleep hours'),
  sound_sleep: z.boolean().default(false),
})

// Combined schema for full form
export const healthFormSchema = demographicsSchema
  .merge(familyHistorySchema)
  .merge(medicalHistorySchema)
  .merge(vitalSignsSchema)
  .merge(labTestsSchema)
  .merge(clinicalVisitSchema)
  .merge(lifestyleSchema)

export type HealthFormData = z.infer<typeof healthFormSchema>

// Step schemas for validation
export const stepSchemas = [
  demographicsSchema,
  familyHistorySchema,
  medicalHistorySchema,
  vitalSignsSchema,
  labTestsSchema,
  clinicalVisitSchema,
  lifestyleSchema,
]

export const stepTitles = [
  'Demographics',
  'Family History',
  'Medical History',
  'Vital Signs',
  'Lab Tests',
  'Clinical Visit',
  'Lifestyle',
  'Review & Submit',
]
