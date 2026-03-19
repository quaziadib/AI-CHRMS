'use client'

import { type UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { ecgResultOptions, type HealthFormData } from '@/lib/health-form-schema'
import { FieldWrapper, FormSelectField } from '@/components/ui/form-field'

interface Props {
  form: UseFormReturn<HealthFormData>
}

export function StepLabResults({ form }: Props) {
  const { register, setValue, watch } = form

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Enter lab test results if available (all fields optional)
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldWrapper label="Blood Glucose (mg/dL)" htmlFor="blood_glucose">
          <Input id="blood_glucose" type="number" placeholder="e.g., 100" {...register('blood_glucose')} />
        </FieldWrapper>
        <FieldWrapper label="Total Cholesterol (mg/dL)" htmlFor="cholesterol">
          <Input id="cholesterol" type="number" placeholder="e.g., 200" {...register('cholesterol')} />
        </FieldWrapper>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldWrapper label="Hemoglobin (g/dL)" htmlFor="hemoglobin">
          <Input id="hemoglobin" type="number" step="0.1" placeholder="e.g., 14.5" {...register('hemoglobin')} />
        </FieldWrapper>
        <FieldWrapper label="Creatinine (mg/dL)" htmlFor="creatinine">
          <Input id="creatinine" type="number" step="0.1" placeholder="e.g., 1.0" {...register('creatinine')} />
        </FieldWrapper>
      </div>
      <FormSelectField
        label="ECG Result"
        value={watch('ecg_result') || ''}
        onValueChange={(v) => setValue('ecg_result', v)}
        placeholder="Select ECG result"
        options={ecgResultOptions}
      />
    </div>
  )
}
