"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { prescriptionsApi } from "@/lib/api"
import type { PrescriptionStatus, PrescriptionUpdate } from "@/lib/api"
import {
  SYMPTOM_SUGGESTIONS,
  LAB_TEST_SUGGESTIONS,
  GENERAL_ADVICE_SUGGESTIONS,
} from "./suggestions"

interface MedicationRow {
  medicine_name: string
  dosage_morning: number
  dosage_afternoon: number
  dosage_night: number
  duration_days: number
  instructions: string
}

interface Props {
  patientId: string
  /** When provided, the form will PATCH the existing prescription instead of POST */
  existingPrescriptionId?: string
  /** Status of the prescription being edited. Omitted when composing a new one. */
  currentStatus?: PrescriptionStatus
  defaultValues?: {
    symptoms_diagnosis?: string[]
    lab_tests?: string[]
    general_advice?: string[]
    medications?: MedicationRow[]
  }
}

function SuggestionTagInput({
  label,
  items,
  suggestions,
  onAdd,
  onRemove,
}: {
  label: string
  items: string[]
  suggestions: string[]
  onAdd: (v: string) => void
  onRemove: (i: number) => void
}) {
  const [text, setText] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const filtered = suggestions.filter(
    (s) => s.toLowerCase().includes(text.toLowerCase()) && !items.includes(s)
  )

  function handleAdd(val: string) {
    const v = val.trim()
    if (v && !items.includes(v)) {
      onAdd(v)
      setText("")
      setShowSuggestions(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
          >
            {item}
            <button type="button" onClick={() => onRemove(i)} aria-label="Remove">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAdd(text)
              }
            }}
            placeholder="Type or choose from suggestions..."
          />
          <Button type="button" variant="outline" onClick={() => handleAdd(text)}>
            Add
          </Button>
        </div>
        {showSuggestions && filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto text-sm">
            {filtered.map((s) => (
              <li
                key={s}
                onMouseDown={() => handleAdd(s)}
                className="cursor-pointer px-3 py-2 hover:bg-accent"
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function MedicationsSection({
  medications,
  onChange,
}: {
  medications: MedicationRow[]
  onChange: (rows: MedicationRow[]) => void
}) {
  function addRow() {
    onChange([
      ...medications,
      { medicine_name: "", dosage_morning: 0, dosage_afternoon: 0, dosage_night: 0, duration_days: 1, instructions: "" },
    ])
  }
  function removeRow(i: number) {
    onChange(medications.filter((_, idx) => idx !== i))
  }
  function setField(i: number, field: keyof MedicationRow, value: string | number) {
    const updated = medications.map((row, idx) => (idx === i ? { ...row, [field]: value } : row))
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      <Label>Medications</Label>
      {medications.map((row, i) => (
        <Card key={i} className="relative">
          <CardContent className="pt-4 pb-3">
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
              aria-label="Remove medication"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Medicine Name *</Label>
                <Input
                  value={row.medicine_name}
                  onChange={(e) => setField(i, "medicine_name", e.target.value)}
                  placeholder="e.g. Metformin 500mg"
                  maxLength={200}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dosage (Morning + Afternoon + Night)</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    value={row.dosage_morning}
                    onChange={(e) => setField(i, "dosage_morning", Number(e.target.value))}
                    className="w-16 text-center"
                    aria-label="Morning"
                  />
                  <span className="text-muted-foreground">+</span>
                  <Input
                    type="number"
                    min={0}
                    value={row.dosage_afternoon}
                    onChange={(e) => setField(i, "dosage_afternoon", Number(e.target.value))}
                    className="w-16 text-center"
                    aria-label="Afternoon"
                  />
                  <span className="text-muted-foreground">+</span>
                  <Input
                    type="number"
                    min={0}
                    value={row.dosage_night}
                    onChange={(e) => setField(i, "dosage_night", Number(e.target.value))}
                    className="w-16 text-center"
                    aria-label="Night"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">Morning + Afternoon + Night (tablets)</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duration (days) *</Label>
                <Input
                  type="number"
                  min={1}
                  value={row.duration_days}
                  onChange={(e) => setField(i, "duration_days", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Instructions (optional)</Label>
                <Input
                  value={row.instructions}
                  onChange={(e) => setField(i, "instructions", e.target.value)}
                  placeholder="e.g. Take after meals"
                  maxLength={500}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={addRow} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Medication
      </Button>
    </div>
  )
}

export function DoctorComposeForm({ patientId, existingPrescriptionId, currentStatus, defaultValues }: Props) {
  const router = useRouter()
  const [symptoms, setSymptoms] = useState<string[]>(defaultValues?.symptoms_diagnosis ?? [])
  const [labTests, setLabTests] = useState<string[]>(defaultValues?.lab_tests ?? [])
  const [advice, setAdvice] = useState<string[]>(defaultValues?.general_advice ?? [])
  const [medications, setMedications] = useState<MedicationRow[]>(
    defaultValues?.medications ?? []
  )
  const [isSaving, setIsSaving] = useState(false)

  function removeItem(list: string[], setList: (v: string[]) => void, idx: number) {
    setList(list.filter((_, i) => i !== idx))
  }

  async function handleSubmit(action: "draft" | "published" | "save") {
    setIsSaving(true)
    const content = {
      symptoms_diagnosis: symptoms.map((itemContent, order) => ({ content: itemContent, order })),
      lab_tests: labTests.map((itemContent, order) => ({ content: itemContent, order })),
      general_advice: advice.map((itemContent, order) => ({ content: itemContent, order })),
      medications: medications.map((m, order) => ({
        ...m,
        order,
        instructions: m.instructions || undefined,
      })),
    }

    let res
    if (existingPrescriptionId) {
      const data: PrescriptionUpdate = action === "save" ? content : { ...content, status: action }
      res = await prescriptionsApi.doctorUpdate(patientId, existingPrescriptionId, data)
    } else {
      res = await prescriptionsApi.doctorCreate(patientId, {
        ...content,
        status: action === "published" ? "published" : "draft",
      })
    }

    setIsSaving(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(
      action === "draft" ? "Draft saved" : action === "published" ? "Prescription published" : "Prescription updated",
    )
    router.push(`/doctor/prescriptions/${patientId}`)
  }

  return (
    <div className="space-y-6">
      <SuggestionTagInput
        label="1. Symptoms & Diagnosis"
        items={symptoms}
        suggestions={SYMPTOM_SUGGESTIONS}
        onAdd={(v) => setSymptoms([...symptoms, v])}
        onRemove={(i) => removeItem(symptoms, setSymptoms, i)}
      />

      <MedicationsSection medications={medications} onChange={setMedications} />

      <SuggestionTagInput
        label="3. Lab Tests"
        items={labTests}
        suggestions={LAB_TEST_SUGGESTIONS}
        onAdd={(v) => setLabTests([...labTests, v])}
        onRemove={(i) => removeItem(labTests, setLabTests, i)}
      />

      <SuggestionTagInput
        label="4. General Advice"
        items={advice}
        suggestions={GENERAL_ADVICE_SUGGESTIONS}
        onAdd={(v) => setAdvice([...advice, v])}
        onRemove={(i) => removeItem(advice, setAdvice, i)}
      />

      <div className="flex gap-3 justify-end pt-2">
        {currentStatus === "published" ? (
          <Button
            type="button"
            disabled={isSaving}
            onClick={() => handleSubmit("save")}
          >
            {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
            Save changes
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => handleSubmit("draft")}
            >
              {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Save Draft
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => handleSubmit("published")}
            >
              {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Publish
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
