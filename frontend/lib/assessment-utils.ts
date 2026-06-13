import type { PatientRecord, RecommendationsOutput } from '@/lib/api'

export const RISK_META = {
  low: { label: 'Low Risk', score: 25, color: 'text-green-600', bar: 'bg-green-500', bg: 'bg-green-50 border-green-200' },
  moderate: { label: 'Moderate Risk', score: 55, color: 'text-amber-600', bar: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200' },
  high: { label: 'High Risk', score: 85, color: 'text-red-600', bar: 'bg-red-500', bg: 'bg-red-50 border-red-200' },
} as const

export type RiskLevel = keyof typeof RISK_META

export function isStructuredRecs(recs: unknown): recs is RecommendationsOutput {
  return typeof recs === 'object' && recs !== null && !Array.isArray(recs) && 'categories' in recs
}

/** First 1–2 sentences — the LLM essence without the wall of text. */
export function essence(text: string, maxSentences = 2): string {
  const parts = text.match(/[^.!?]+[.!?]+/g)
  if (!parts?.length) return text.trim()
  return parts.slice(0, maxSentences).join(' ').trim()
}

/** Word-limited phrase — never cuts mid-word. */
export function trimWords(text: string, maxWords = 10): string {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return words.join(' ')
  return words.slice(0, maxWords).join(' ')
}

/**
 * Extract a short, complete action summary from an LLM tip.
 * Strips patient-context preamble ("Your glucose of X…") and keeps the actionable part.
 */
export function summarizeTip(text: string, maxWords = 10): string {
  const t = text.trim()
  if (!t) return t

  // Action clause after em-dash / en-dash (most common LLM pattern)
  const dashParts = t.split(/\s[—–]\s/)
  if (dashParts.length > 1) {
    return trimWords(dashParts[dashParts.length - 1].trim(), maxWords)
  }

  // "Context: action" — skip if colon is part of a ratio (e.g. 120/80)
  const colonMatch = t.match(/:\s+(?=[A-Za-z])/)
  if (colonMatch?.index != null && colonMatch.index < 90) {
    const action = t.slice(colonMatch.index + colonMatch[0].length).trim()
    if (action.length > 8) return trimWords(action, maxWords)
  }

  // Drop "Your …" setup — start at first imperative verb
  const verbMatch = t.match(
    /\b(maintain|keep|prioriti[sz]e|reduce|increase|limit|avoid|aim|track|monitor|walk|exercise|eat|drink|sleep|choose|add|swap|schedule|check|test|visit|continue|stop|quit)\b/i,
  )
  if (verbMatch?.index != null && verbMatch.index > 0) {
    return trimWords(t.slice(verbMatch.index), maxWords)
  }

  return trimWords(essence(t, 1), maxWords)
}

/** One-line overall guidance from recommendations summary. */
export function summaryLine(text: string, maxWords = 18): string {
  return trimWords(essence(text, 1), maxWords)
}

/** Full tip text for expanded view — unchanged from source. */
export function shortenTip(text: string, max = 88): string {
  const t = text.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const sp = cut.lastIndexOf(' ')
  return `${(sp > 40 ? cut.slice(0, sp) : cut).trim()}…`
}

export interface VitalHighlight {
  label: string
  value: string
  hint?: string
  tone: 'neutral' | 'good' | 'warn' | 'alert'
}

export function getVitalHighlights(record: PatientRecord): VitalHighlight[] {
  const items: VitalHighlight[] = [
    {
      label: 'Blood glucose',
      value: record.blood_glucose != null ? `${record.blood_glucose} mg/dL` : 'Not recorded',
      tone:
        record.blood_glucose == null
          ? 'neutral'
          : record.blood_glucose >= 126
            ? 'alert'
            : record.blood_glucose >= 100
              ? 'warn'
              : 'good',
    },
    {
      label: 'BMI',
      value: record.bmi.toFixed(1),
      tone: record.bmi >= 30 ? 'alert' : record.bmi >= 25 ? 'warn' : 'good',
    },
    {
      label: 'Blood pressure',
      value: `${record.bp_systolic}/${record.bp_diastolic}`,
      tone: record.bp_systolic >= 140 || record.bp_diastolic >= 90 ? 'alert' : record.bp_systolic >= 130 ? 'warn' : 'good',
    },
    {
      label: 'Pulse',
      value: `${record.pulse_rate} bpm`,
      tone: record.pulse_rate > 100 || record.pulse_rate < 60 ? 'warn' : 'good',
    },
  ]
  return items
}

export const TONE_STYLES = {
  neutral: 'bg-muted/60 border-border',
  good: 'bg-green-50 border-green-200',
  warn: 'bg-amber-50 border-amber-200',
  alert: 'bg-red-50 border-red-200',
} as const
