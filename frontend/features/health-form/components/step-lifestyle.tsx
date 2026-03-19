'use client'

import { type UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  smokingOptions,
  physicalActivityOptions,
  alcoholOptions,
  type HealthFormData,
} from '@/lib/health-form-schema'
import { FieldWrapper, FormSelectField } from '@/components/ui/form-field'

interface Props {
  form: UseFormReturn<HealthFormData>
}

export function StepLifestyle({ form }: Props) {
  const { register, formState: { errors }, setValue, watch } = form

  return (
    <div className="space-y-6">
      <FormSelectField
        label="Smoking Status *"
        value={watch('smoking')}
        onValueChange={(v) => setValue('smoking', v)}
        placeholder="Select smoking status"
        options={smokingOptions}
        error={errors.smoking?.message}
      />
      <FormSelectField
        label="Physical Activity Level *"
        value={watch('physical_activity')}
        onValueChange={(v) => setValue('physical_activity', v)}
        placeholder="Select activity level"
        options={physicalActivityOptions}
        error={errors.physical_activity?.message}
      />
      <FormSelectField
        label="Alcohol Consumption *"
        value={watch('alcohol')}
        onValueChange={(v) => setValue('alcohol', v)}
        placeholder="Select alcohol consumption"
        options={alcoholOptions}
        error={errors.alcohol?.message}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FieldWrapper label="Average Sleep Hours *" htmlFor="sleep_hours" error={errors.sleep_hours?.message}>
          <Input id="sleep_hours" type="number" step="0.5" placeholder="e.g., 7.5" {...register('sleep_hours')} />
        </FieldWrapper>
        <div className="flex items-center space-x-3 p-4 border rounded-lg">
          <Checkbox
            id="sound_sleep"
            checked={watch('sound_sleep')}
            onCheckedChange={(checked) => setValue('sound_sleep', checked as boolean)}
          />
          <Label htmlFor="sound_sleep" className="cursor-pointer">
            Do you generally have sound/restful sleep?
          </Label>
        </div>
      </div>
    </div>
  )
}
