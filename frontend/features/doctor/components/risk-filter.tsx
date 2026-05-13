'use client'

import { Button } from '@/components/ui/button'

const LEVELS = [
  { value: '', label: 'All' },
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
]

interface Props {
  value: string
  onChange: (value: string) => void
}

export function RiskFilter({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {LEVELS.map((level) => (
        <Button
          key={level.value}
          variant={value === level.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(level.value)}
        >
          {level.label}
        </Button>
      ))}
    </div>
  )
}
