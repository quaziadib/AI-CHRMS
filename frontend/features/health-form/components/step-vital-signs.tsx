'use client'

import { type UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { type HealthFormData } from '@/lib/health-form-schema'
import { getBMICategory } from '@/lib/utils'
import { FieldWrapper } from '@/components/ui/form-field'

interface Props {
  form: UseFormReturn<HealthFormData>
}

export function StepVitalSigns({ form }: Props) {
  const { register, formState: { errors }, watch } = form

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <FieldWrapper label="Systolic BP (mmHg) *" htmlFor="bp_systolic" error={errors.bp_systolic?.message}>
          <Input id="bp_systolic" type="number" placeholder="e.g., 120" {...register('bp_systolic')} />
        </FieldWrapper>
        <FieldWrapper label="Diastolic BP (mmHg) *" htmlFor="bp_diastolic" error={errors.bp_diastolic?.message}>
          <Input id="bp_diastolic" type="number" placeholder="e.g., 80" {...register('bp_diastolic')} />
        </FieldWrapper>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldWrapper label="Height (cm) *" htmlFor="height" error={errors.height?.message}>
          <Input id="height" type="number" placeholder="e.g., 170" {...register('height')} />
        </FieldWrapper>
        <FieldWrapper label="Weight (kg) *" htmlFor="weight" error={errors.weight?.message}>
          <Input id="weight" type="number" placeholder="e.g., 70" {...register('weight')} />
        </FieldWrapper>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldWrapper label="BMI (Auto-calculated)">
          <div className="flex items-center gap-2">
            <Input value={watch('bmi') || ''} readOnly className="bg-muted" />
            {watch('bmi') && (
              <span className="text-sm text-muted-foreground">
                ({getBMICategory(watch('bmi') || 0)})
              </span>
            )}
          </div>
        </FieldWrapper>
        <FieldWrapper label="Pulse Rate (bpm) *" htmlFor="pulse_rate" error={errors.pulse_rate?.message}>
          <Input id="pulse_rate" type="number" placeholder="e.g., 72" {...register('pulse_rate')} />
        </FieldWrapper>
      </div>
    </div>
  )
}
