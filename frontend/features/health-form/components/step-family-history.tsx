'use client'

import { type UseFormReturn } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { type HealthFormData } from '@/lib/health-form-schema'

interface Props {
  form: UseFormReturn<HealthFormData>
}

const familyHistoryItems = [
  { key: 'family_diabetes', label: 'Diabetes' },
  { key: 'family_hypertension', label: 'Hypertension (High Blood Pressure)' },
  { key: 'family_cvd', label: 'Cardiovascular Disease' },
  { key: 'family_stroke', label: 'Stroke' },
] as const

export function StepFamilyHistory({ form }: Props) {
  const { setValue, watch } = form

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Select any conditions that run in your family (parents, siblings, grandparents)
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {familyHistoryItems.map((item) => (
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
    </div>
  )
}
