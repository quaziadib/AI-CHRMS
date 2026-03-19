import { type ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FieldWrapperProps {
  label: string
  htmlFor?: string
  error?: string
  children: ReactNode
}

export function FieldWrapper({ label, htmlFor, error, children }: FieldWrapperProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

interface FormSelectFieldProps {
  label: string
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  options: readonly string[]
  error?: string
}

export function FormSelectField({ label, value, onValueChange, placeholder, options, error }: FormSelectFieldProps) {
  return (
    <FieldWrapper label={label} error={error}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  )
}
