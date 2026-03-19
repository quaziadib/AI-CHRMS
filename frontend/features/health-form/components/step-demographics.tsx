'use client'

import { type UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { districts, genderOptions, type HealthFormData } from '@/lib/health-form-schema'
import { FieldWrapper, FormSelectField } from '@/components/ui/form-field'

interface Props {
  form: UseFormReturn<HealthFormData>
}

export function StepDemographics({ form }: Props) {
  const { register, formState: { errors }, setValue, watch } = form

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <FieldWrapper label="Age (years) *" htmlFor="age" error={errors.age?.message}>
          <Input id="age" type="number" placeholder="Enter age" {...register('age')} />
        </FieldWrapper>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormSelectField
          label="Gender *"
          value={watch('gender')}
          onValueChange={(v) => setValue('gender', v)}
          placeholder="Select gender"
          options={genderOptions}
          error={errors.gender?.message}
        />
        <FormSelectField
          label="District *"
          value={watch('district')}
          onValueChange={(v) => setValue('district', v)}
          placeholder="Select district"
          options={districts}
          error={errors.district?.message}
        />
      </div>
    </div>
  )
}
