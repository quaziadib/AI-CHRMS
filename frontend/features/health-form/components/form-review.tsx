'use client'

import { type UseFormReturn } from 'react-hook-form'
import { type HealthFormData } from '@/lib/health-form-schema'
import { getBMICategory } from '@/lib/utils'

interface Props {
  form: UseFormReturn<HealthFormData>
}

export function FormReview({ form }: Props) {
  const { watch } = form

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 bg-muted/50">
        <h3 className="font-semibold mb-4">Review Your Information</h3>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Demographics</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Age:</dt>
                <dd className="font-medium">{watch('age')} years</dd>
              </div>
              <div className="flex justify-between">
                <dt>Gender:</dt>
                <dd className="font-medium">{watch('gender')}</dd>
              </div>
              <div className="flex justify-between">
                <dt>District:</dt>
                <dd className="font-medium">{watch('district')}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Vital Signs</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Blood Pressure:</dt>
                <dd className="font-medium">{watch('bp_systolic')}/{watch('bp_diastolic')} mmHg</dd>
              </div>
              <div className="flex justify-between">
                <dt>BMI:</dt>
                <dd className="font-medium">{watch('bmi')} ({getBMICategory(watch('bmi') || 0)})</dd>
              </div>
              <div className="flex justify-between">
                <dt>Pulse Rate:</dt>
                <dd className="font-medium">{watch('pulse_rate')} bpm</dd>
              </div>
            </dl>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Family History</h4>
            <ul className="text-sm space-y-1">
              {watch('family_diabetes') && <li>Diabetes</li>}
              {watch('family_hypertension') && <li>Hypertension</li>}
              {watch('family_cvd') && <li>Cardiovascular Disease</li>}
              {watch('family_stroke') && <li>Stroke</li>}
              {!watch('family_diabetes') && !watch('family_hypertension') &&
               !watch('family_cvd') && !watch('family_stroke') && (
                <li className="text-muted-foreground">None reported</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Lifestyle</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Smoking:</dt>
                <dd className="font-medium">{watch('smoking')}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Activity:</dt>
                <dd className="font-medium truncate max-w-[150px]">{watch('physical_activity')}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Sleep:</dt>
                <dd className="font-medium">{watch('sleep_hours')} hours</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm">
          By submitting this form, you confirm that the information provided is accurate
          to the best of your knowledge. A unique Patient ID (PID) will be automatically assigned.
        </p>
      </div>
    </div>
  )
}
