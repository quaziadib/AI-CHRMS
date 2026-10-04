'use client'

import { Heart, ShieldCheck, Stethoscope, Globe2 } from 'lucide-react'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type SignupRole = 'user' | 'doctor' | 'national_admin' | 'admin'

interface RoleOption {
  value: SignupRole
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  needsApproval: boolean
}

const PATIENT: RoleOption = {
  value: 'user',
  title: 'Patient',
  description: 'Track your health, get risk insights and share records with doctors.',
  icon: Heart,
  needsApproval: false,
}

const PROFESSIONAL: RoleOption[] = [
  {
    value: 'doctor',
    title: 'Doctor',
    description: 'Review patients you are given access to and write prescriptions.',
    icon: Stethoscope,
    needsApproval: true,
  },
  {
    value: 'national_admin',
    title: 'National Admin',
    description: 'View population-level analytics and resource planning.',
    icon: Globe2,
    needsApproval: true,
  },
  {
    value: 'admin',
    title: 'Admin',
    description: 'Manage users, role requests and platform records.',
    icon: ShieldCheck,
    needsApproval: true,
  },
]

function RoleCard({ option, selected }: { option: RoleOption; selected: boolean }) {
  const Icon = option.icon
  const id = `role-${option.value}`
  return (
    <Label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border p-4 leading-normal transition-colors',
        'hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5',
        'has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
      )}
    >
      <RadioGroupItem value={option.value} id={id} className="mt-1" />
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <span className="flex-1 space-y-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{option.title}</span>
          {option.needsApproval && (
            <span className="whitespace-nowrap rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              Approval required
            </span>
          )}
          <span className="sr-only">{selected ? '(selected)' : ''}</span>
        </span>
        <span className="block text-sm font-normal text-muted-foreground">{option.description}</span>
      </span>
    </Label>
  )
}

interface RoleSelectorProps {
  value: SignupRole
  onChange: (role: SignupRole) => void
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <div className="space-y-3">
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as SignupRole)}
        aria-label="Account role"
        aria-describedby="role-help"
      >
        <RoleCard option={PATIENT} selected={value === PATIENT.value} />
        <p className="pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Or request a professional role
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {PROFESSIONAL.map((o) => (
            <RoleCard key={o.value} option={o} selected={value === o.value} />
          ))}
        </div>
      </RadioGroup>
      <p id="role-help" className="text-xs text-muted-foreground" aria-live="polite">
        {value === 'user'
          ? 'Patient accounts are active immediately.'
          : 'This role needs admin approval. You can use the app as a patient until it is approved.'}
      </p>
    </div>
  )
}
