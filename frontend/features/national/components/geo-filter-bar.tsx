'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { GeoOption } from '@/lib/api/national'

type Props = {
  divisions: GeoOption[]
  districts: GeoOption[]
  divisionId: string
  districtId: string
  onDivisionChange: (id: string) => void
  onDistrictChange: (id: string) => void
  onReset: () => void
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  value: string
  options: GeoOption[]
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <select
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export function GeoFilterBar(props: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Only divisions and districts present in stored patient records are listed.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={props.onReset}>
          Reset regions
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Division"
          value={props.divisionId}
          options={[{ id: '', name: 'All divisions' }, ...props.divisions]}
          onChange={props.onDivisionChange}
        />
        <SelectField
          label="District (Zila)"
          value={props.districtId}
          options={[{ id: '', name: 'All districts' }, ...props.districts]}
          onChange={props.onDistrictChange}
          disabled={!props.divisionId || props.districts.length === 0}
        />
      </div>
    </div>
  )
}
