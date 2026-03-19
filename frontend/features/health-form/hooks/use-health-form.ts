'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { recordsApi } from '@/lib/api'
import { useFormDraft } from '@/hooks/use-form-draft'
import { healthFormSchema, stepSchemas, type HealthFormData } from '@/lib/health-form-schema'
import { calculateBMI } from '@/lib/utils'
import type { PatientRecordCreate } from '@/lib/api'

const TOTAL_STEPS = 8

export function useHealthForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter()
  const { loadDraft, saveDraft, clearDraft } = useFormDraft()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDraftPrompt, setShowDraftPrompt] = useState(false)
  const [hasRecord, setHasRecord] = useState<boolean | null>(null)

  const form = useForm<HealthFormData>({
    resolver: zodResolver(healthFormSchema),
    defaultValues: {
      age: undefined,
      gender: '',
      district: '',
      family_diabetes: false,
      family_hypertension: false,
      family_cvd: false,
      family_stroke: false,
      diabetes_history: false,
      hypertension: false,
      cvd: false,
      stroke: false,
      allergies: '',
      pregnancies: undefined,
      bp_systolic: undefined,
      bp_diastolic: undefined,
      height: undefined,
      weight: undefined,
      bmi: undefined,
      pulse_rate: undefined,
      blood_glucose: undefined,
      cholesterol: undefined,
      hemoglobin: undefined,
      creatinine: undefined,
      ecg_result: '',
      symptoms: '',
      diagnosis: '',
      smoking: '',
      physical_activity: '',
      alcohol: '',
      sleep_hours: undefined,
      sound_sleep: false,
    },
    mode: 'onChange',
  })

  const { watch, setValue, trigger, getValues, formState } = form

  const height = watch('height')
  const weight = watch('weight')

  // Calculate BMI automatically
  useEffect(() => {
    if (height && weight && height > 0 && weight > 0) {
      const bmi = calculateBMI(height, weight)
      setValue('bmi', bmi)
    }
  }, [height, weight, setValue])

  // Check if user already has a record
  useEffect(() => {
    recordsApi.list({ limit: 1 }).then(({ data }) => {
      if (data && data.length > 0) {
        setHasRecord(true)
      } else {
        setHasRecord(false)
      }
    })
  }, [])

  // Check for saved draft on mount
  useEffect(() => {
    const draft = loadDraft()
    if (draft && Object.keys(draft.data).length > 0) {
      setShowDraftPrompt(true)
    }
  }, [loadDraft])

  const restoreDraft = () => {
    const draft = loadDraft()
    if (draft) {
      Object.entries(draft.data).forEach(([key, value]) => {
        setValue(key as keyof HealthFormData, value as never)
      })
      setCurrentStep(draft.currentStep)
      toast.success('Draft restored successfully')
    }
    setShowDraftPrompt(false)
  }

  const discardDraft = () => {
    clearDraft()
    setShowDraftPrompt(false)
  }

  const handleSaveDraft = useCallback(() => {
    const data = getValues()
    saveDraft(currentStep, data as Record<string, unknown>)
    toast.success('Draft saved')
  }, [currentStep, getValues, saveDraft])

  const validateCurrentStep = async (): Promise<boolean> => {
    if (currentStep === TOTAL_STEPS) return true // Review step

    const stepSchema = stepSchemas[currentStep - 1]
    if (!stepSchema) return true

    const stepFields = Object.keys(stepSchema.shape) as Array<keyof HealthFormData>
    const isValid = await trigger(stepFields)
    return isValid
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid) {
      handleSaveDraft()
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = () => {
    // form.handleSubmit passes Zod-coerced values (numbers, not strings)
    form.handleSubmit(
      async (validatedData) => {
        setIsSubmitting(true)
        const cleanData: PatientRecordCreate = {
          ...validatedData,
          // Replace empty-string optionals with undefined
          blood_glucose: validatedData.blood_glucose || undefined,
          cholesterol: validatedData.cholesterol || undefined,
          hemoglobin: validatedData.hemoglobin || undefined,
          creatinine: validatedData.creatinine || undefined,
          ecg_result: validatedData.ecg_result || undefined,
          allergies: validatedData.allergies || undefined,
          symptoms: validatedData.symptoms || undefined,
          diagnosis: validatedData.diagnosis || undefined,
        }
        const { data: result, error } = await recordsApi.create(cleanData)
        if (result && !error) {
          clearDraft()
          toast.success('Health record submitted successfully!')
          onSuccess()
          router.push('/records')
        } else {
          toast.error(error || 'Failed to submit record')
        }
        setIsSubmitting(false)
      },
      () => {
        toast.error('Please fill in all required fields')
      }
    )()
  }

  const progress = (currentStep / TOTAL_STEPS) * 100

  return {
    form,
    currentStep,
    setCurrentStep,
    totalSteps: TOTAL_STEPS,
    progress,
    isSubmitting,
    hasRecord,
    showDraftPrompt,
    handleNext,
    handlePrevious,
    handleSubmit,
    restoreDraft,
    discardDraft,
    handleSaveDraft,
  }
}
