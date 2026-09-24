'use client'

import { Salad, Dumbbell, Moon, Activity } from 'lucide-react'
import { CardContent } from '@/components/ui/card'
import {
  VitalSignsSection,
  MedicalHistorySection,
  LifestyleSection,
  LabResultsSection,
  ClinicalNotesSection,
} from '@/components/ui/record-sections'
import type { PatientRecord, RecommendationsOutput } from '@/lib/api'
import { FlagsPanel } from './flags-panel'

const CATEGORY_CONFIG = [
  { key: 'diet' as const, label: 'Diet & Nutrition', icon: Salad },
  { key: 'exercise' as const, label: 'Exercise', icon: Dumbbell },
  { key: 'lifestyle' as const, label: 'Lifestyle', icon: Moon },
  { key: 'monitoring' as const, label: 'Monitoring', icon: Activity },
]

function isStructuredRecs(recs: unknown): recs is RecommendationsOutput {
  return typeof recs === 'object' && recs !== null && !Array.isArray(recs) && 'categories' in recs
}

interface Props {
  record: PatientRecord
  readOnly?: boolean
}

export function RecordDetail({ record, readOnly = false }: Props) {
  const recs = record.recommendations

  return (
    <CardContent className="border-t bg-muted/20 pt-4">
      {readOnly && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Read-only — patient-shared health record
        </div>
      )}
      {record.flags !== undefined && (
        <div className="mb-4">
          <FlagsPanel flags={record.flags} />
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        <VitalSignsSection record={record} />
        <MedicalHistorySection record={record} />
        <LifestyleSection record={record} />
        <LabResultsSection record={record} />
        <ClinicalNotesSection record={record} />

        {recs && isStructuredRecs(recs) && (
          <section className="sm:col-span-2 lg:col-span-3">
            <h4 className="font-medium text-muted-foreground mb-3">Recommendations</h4>
            {recs.summary && (
              <p className="text-sm text-muted-foreground italic mb-3">{recs.summary}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CATEGORY_CONFIG.map(({ key, label, icon: CatIcon }) => {
                const items = recs.categories[key]
                if (!items?.length) return null
                return (
                  <div key={key}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                      </p>
                    </div>
                    <ul className="space-y-1.5">
                      {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm">
                          <span className="mt-0.5 text-muted-foreground flex-shrink-0">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {recs && Array.isArray(recs) && recs.length > 0 && (
          <section className="sm:col-span-2 lg:col-span-3">
            <h4 className="font-medium text-muted-foreground mb-2">Recommendations</h4>
            <ul className="space-y-1.5">
              {(recs as string[]).map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground flex-shrink-0">{i + 1}.</span>
                  {rec}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </CardContent>
  )
}
