'use client'

import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check } from 'lucide-react'
import {
  districts,
  genderOptions,
  smokingOptions,
  physicalActivityOptions,
  alcoholOptions,
  ecgResultOptions,
} from '@/lib/health-form-schema'
import type { PatientRecord } from '@/lib/api'

type EditData = Partial<PatientRecord>

interface Props {
  editData: EditData
  setField: (field: string, value: unknown) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
}

export function RecordEditForm({ editData, setField, onSave, onCancel, isSaving }: Props) {
  return (
    <CardContent className="border-t pt-6">
      <div className="space-y-8">

        {/* Demographics */}
        <section>
          <h4 className="font-semibold mb-4">Demographics</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Age (years)</Label>
              <Input type="number" value={editData.age ?? ''} onChange={e => setField('age', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={editData.gender ?? ''} onValueChange={v => setField('gender', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{genderOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>District</Label>
              <Select value={editData.district ?? ''} onValueChange={v => setField('district', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{districts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Vital Signs */}
        <section>
          <h4 className="font-semibold mb-4">Vital Signs</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Systolic BP (mmHg)</Label>
              <Input type="number" value={editData.bp_systolic ?? ''} onChange={e => setField('bp_systolic', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Diastolic BP (mmHg)</Label>
              <Input type="number" value={editData.bp_diastolic ?? ''} onChange={e => setField('bp_diastolic', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Pulse Rate (bpm)</Label>
              <Input type="number" value={editData.pulse_rate ?? ''} onChange={e => setField('pulse_rate', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input type="number" value={editData.height ?? ''} onChange={e => setField('height', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input type="number" value={editData.weight ?? ''} onChange={e => setField('weight', Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>BMI (auto-calculated)</Label>
              <Input value={editData.bmi ?? ''} readOnly className="bg-muted" />
            </div>
          </div>
        </section>

        {/* Medical & Family History */}
        <section>
          <h4 className="font-semibold mb-4">Medical &amp; Family History</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { key: 'diabetes_history', label: 'Diabetes (personal)' },
              { key: 'hypertension', label: 'Hypertension (personal)' },
              { key: 'cvd', label: 'CVD (personal)' },
              { key: 'stroke', label: 'Stroke (personal)' },
              { key: 'family_diabetes', label: 'Diabetes (family)' },
              { key: 'family_hypertension', label: 'Hypertension (family)' },
              { key: 'family_cvd', label: 'CVD (family)' },
              { key: 'family_stroke', label: 'Stroke (family)' },
            ].map(item => (
              <div key={item.key} className="flex items-center gap-3 p-3 border rounded-lg">
                <Checkbox
                  checked={!!editData[item.key as keyof EditData]}
                  onCheckedChange={v => setField(item.key, v)}
                />
                <Label className="cursor-pointer">{item.label}</Label>
              </div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <div className="space-y-2">
              <Label>Allergies</Label>
              <Input value={editData.allergies ?? ''} onChange={e => setField('allergies', e.target.value)} placeholder="List any known allergies" />
            </div>
            {editData.gender === 'Female' && (
              <div className="space-y-2">
                <Label>Number of Pregnancies</Label>
                <Input type="number" value={editData.pregnancies ?? ''} onChange={e => setField('pregnancies', Number(e.target.value))} />
              </div>
            )}
          </div>
        </section>

        {/* Lab Results */}
        <section>
          <h4 className="font-semibold mb-4">Lab Results (optional)</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Blood Glucose (mg/dL)</Label>
              <Input type="number" value={editData.blood_glucose ?? ''} onChange={e => setField('blood_glucose', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div className="space-y-2">
              <Label>Cholesterol (mg/dL)</Label>
              <Input type="number" value={editData.cholesterol ?? ''} onChange={e => setField('cholesterol', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div className="space-y-2">
              <Label>Hemoglobin (g/dL)</Label>
              <Input type="number" step="0.1" value={editData.hemoglobin ?? ''} onChange={e => setField('hemoglobin', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div className="space-y-2">
              <Label>Creatinine (mg/dL)</Label>
              <Input type="number" step="0.1" value={editData.creatinine ?? ''} onChange={e => setField('creatinine', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div className="space-y-2">
              <Label>ECG Result</Label>
              <Select value={editData.ecg_result ?? ''} onValueChange={v => setField('ecg_result', v)}>
                <SelectTrigger><SelectValue placeholder="Select result" /></SelectTrigger>
                <SelectContent>{ecgResultOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Lifestyle */}
        <section>
          <h4 className="font-semibold mb-4">Lifestyle</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Smoking Status</Label>
              <Select value={editData.smoking ?? ''} onValueChange={v => setField('smoking', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{smokingOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Physical Activity</Label>
              <Select value={editData.physical_activity ?? ''} onValueChange={v => setField('physical_activity', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{physicalActivityOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alcohol Consumption</Label>
              <Select value={editData.alcohol ?? ''} onValueChange={v => setField('alcohol', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{alcoholOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Average Sleep Hours</Label>
              <Input type="number" step="0.5" value={editData.sleep_hours ?? ''} onChange={e => setField('sleep_hours', Number(e.target.value))} />
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Checkbox
                checked={!!editData.sound_sleep}
                onCheckedChange={v => setField('sound_sleep', v)}
              />
              <Label className="cursor-pointer">Sound / restful sleep</Label>
            </div>
          </div>
        </section>

        {/* Clinical Notes */}
        <section>
          <h4 className="font-semibold mb-4">Clinical Notes</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Symptoms</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                value={editData.symptoms ?? ''}
                onChange={e => setField('symptoms', e.target.value)}
                placeholder="Describe current symptoms"
              />
            </div>
            <div className="space-y-2">
              <Label>Diagnosis / Notes</Label>
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                value={editData.diagnosis ?? ''}
                onChange={e => setField('diagnosis', e.target.value)}
                placeholder="Enter diagnosis or notes"
              />
            </div>
          </div>
        </section>

        <div className="flex gap-3 pt-2 border-t">
          <Button onClick={onSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Spinner size="sm" /> : <Check className="h-4 w-4" />}
            Save Changes
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        </div>
      </div>
    </CardContent>
  )
}
