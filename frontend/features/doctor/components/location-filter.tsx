'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  value: string
  options: string[]
  onChange: (value: string) => void
}

const ALL_VALUE = '__all__'

export function LocationFilter({ value, options, onChange }: Props) {
  return (
    <Select
      value={value || ALL_VALUE}
      onValueChange={(next) => onChange(next === ALL_VALUE ? '' : next)}
    >
      <SelectTrigger className="w-[200px]" aria-label="Filter by district">
        <SelectValue placeholder="All districts" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>All districts</SelectItem>
        {options.map((district) => (
          <SelectItem key={district} value={district}>
            {district}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
