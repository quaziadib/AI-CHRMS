'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { IndividualPredictResponse } from '@/lib/api/national'
import { cn } from '@/lib/utils'

type Props = {
  onPredict: (body: {
    age: number
    gender: string
    bmi: number
    glucose: number
    family_history: string
    activity: string
  }) => Promise<void>
  isPredicting: boolean
  prediction: IndividualPredictResponse | null
}

export function IndividualPredictorPanel({ onPredict, isPredicting, prediction }: Props) {
  const [age, setAge] = useState(45)
  const [gender, setGender] = useState('female')
  const [bmi, setBmi] = useState(27.4)
  const [glucose, setGlucose] = useState(118)
  const [family, setFamily] = useState('yes')
  const [activity, setActivity] = useState('low')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onPredict({
      age,
      gender,
      bmi,
      glucose,
      family_history: family,
      activity,
    })
  }

  const badgeClass =
    prediction?.risk_level === 'high'
      ? 'bg-red-50 text-red-700 border-red-200'
      : prediction?.risk_level === 'moderate'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200'

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-muted-foreground">
          What-if simulation powered by LLM — not saved to patient records. Not XGBoost.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age (years)">
            <Input type="number" min={15} max={100} value={age} onChange={(e) => setAge(Number(e.target.value))} />
          </Field>
          <Field label="Gender">
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </Field>
          <Field label="BMI (kg/m²)">
            <Input type="number" step="0.1" value={bmi} onChange={(e) => setBmi(Number(e.target.value))} />
          </Field>
          <Field label="Fasting glucose (mg/dL)">
            <Input type="number" value={glucose} onChange={(e) => setGlucose(Number(e.target.value))} />
          </Field>
          <Field label="Family history">
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={family} onChange={(e) => setFamily(e.target.value)}>
              <option value="yes">Yes (parent/sibling)</option>
              <option value="no">No</option>
            </select>
          </Field>
          <Field label="Physical activity">
            <select className="w-full rounded-md border px-3 py-2 text-sm" value={activity} onChange={(e) => setActivity(e.target.value)}>
              <option value="low">Sedentary / low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </Field>
        </div>
        <Button type="submit" className="w-full" disabled={isPredicting}>
          {isPredicting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Run LLM prediction
        </Button>
      </form>

      <div className="rounded-lg border bg-slate-950 p-4 text-white">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-slate-400">Model inference output</span>
          {prediction ? (
            <span className={cn('rounded-full border px-2 py-0.5 text-xs font-semibold', badgeClass)}>
              {prediction.risk_level.toUpperCase()} RISK
            </span>
          ) : null}
        </div>
        {prediction ? (
          <>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-3xl font-bold text-emerald-400">{prediction.probability_percent.toFixed(1)}%</span>
                <span className="ml-1 text-xs text-slate-400">probability</span>
              </div>
              <div className="text-right text-sm">
                <div className="text-xs text-slate-400">Category</div>
                <div className="font-medium">{prediction.category_label}</div>
              </div>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
              <span>
                Confidence: <strong className="text-emerald-400">{prediction.confidence_percent.toFixed(0)}%</strong>
              </span>
              <span>
                Factors: <strong className="text-emerald-300">{prediction.top_factors.join(', ')}</strong>
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">Submit the form to generate an LLM risk estimate.</p>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}
