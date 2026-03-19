'use client'

import { type UseFormReturn } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { type HealthFormData } from '@/lib/health-form-schema'

interface Props {
  form: UseFormReturn<HealthFormData>
}

export function StepClinical({ form }: Props) {
  const { register } = form

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="symptoms">Current Symptoms</Label>
        <textarea
          id="symptoms"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Describe any current symptoms or complaints"
          {...register('symptoms')}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnosis / Clinical Notes</Label>
        <textarea
          id="diagnosis"
          className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter diagnosis or clinical notes"
          {...register('diagnosis')}
        />
      </div>
    </div>
  )
}
