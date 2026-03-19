'use client'

import { type UseFormReturn } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { type HealthFormData } from '@/lib/health-form-schema'

interface Props {
  form: UseFormReturn<HealthFormData>
}

const medicalHistoryItems = [
  { key: 'diabetes_history', label: 'Diabetes' },
  { key: 'hypertension', label: 'Hypertension' },
  { key: 'cvd', label: 'Cardiovascular Disease' },
  { key: 'stroke', label: 'Stroke' },
] as const

export function StepMedicalHistory({ form }: Props) {
  const { register, setValue, watch } = form

  const gender = watch('gender')

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Select any conditions you have been diagnosed with
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {medicalHistoryItems.map((item) => (
          <div key={item.key} className="flex items-center space-x-3 p-4 border rounded-lg">
            <Checkbox
              id={item.key}
              checked={watch(item.key as keyof HealthFormData) as boolean}
              onCheckedChange={(checked) =>
                setValue(item.key as keyof HealthFormData, checked as never)
              }
            />
            <Label htmlFor={item.key} className="cursor-pointer">
              {item.label}
            </Label>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Label htmlFor="allergies">Allergies (if any)</Label>
        <Input
          id="allergies"
          placeholder="List any known allergies"
          {...register('allergies')}
        />
      </div>
      {gender === 'Female' && (
        <div className="space-y-2">
          <Label htmlFor="pregnancies">Number of Pregnancies</Label>
          <Input
            id="pregnancies"
            type="number"
            placeholder="Enter number"
            {...register('pregnancies')}
          />
        </div>
      )}
    </div>
  )
}
