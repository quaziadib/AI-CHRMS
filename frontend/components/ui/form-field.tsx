import { type ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
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
  hint?: string
  className?: string
  children: ReactNode
}

/**
 * Value for the input's `aria-describedby`, matching the ids FieldWrapper
 * renders for its hint and error text (requires `htmlFor` to equal the input id).
 */
export function describedBy(id: string, { error, hint }: { error?: string; hint?: string }) {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean)
  return ids.length ? ids.join(' ') : undefined
}

export function FieldWrapper({ label, htmlFor, error, hint, className, children }: FieldWrapperProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && (
        <p id={htmlFor && `${htmlFor}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={htmlFor && `${htmlFor}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
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
