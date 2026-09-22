'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PatternInsight } from '@/lib/api/national'

type Props = {
  insights: PatternInsight[]
  insufficientData: boolean
  onDiscover: () => void
  isDiscovering: boolean
}

export function PatternDiscoveryPanel({
  insights,
  insufficientData,
  onDiscover,
  isDiscovering,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={onDiscover} disabled={isDiscovering}>
          {isDiscovering ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Discover patterns
        </Button>
        <p className="text-xs text-muted-foreground">
          Uses anonymized district aggregates only — exploratory, not causal.
        </p>
      </div>

      {insufficientData ? (
        <p className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
          Insufficient anonymized data for pattern analysis yet.
        </p>
      ) : null}

      {insights.length > 0 ? (
        <ul className="space-y-3">
          {insights.map((insight, idx) => (
            <li key={idx} className="rounded-lg border bg-card px-4 py-3">
              <p className="text-sm font-medium text-foreground">{insight.statement}</p>
              {insight.caveat ? (
                <p className="mt-1 text-xs text-muted-foreground">{insight.caveat}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : !insufficientData ? (
        <p className="text-sm text-muted-foreground">Run discovery to generate national insights.</p>
      ) : null}
    </div>
  )
}
