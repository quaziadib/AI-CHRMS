'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldWrapper, describedBy } from '@/components/ui/form-field'
import { Spinner } from '@/components/ui/spinner'
import { DoctorDetailsSection } from '@/features/auth/doctor-details-section'
import { PasswordInput } from '@/features/auth/password-input'
import type { AdminUserCreate, AssignableRole, User } from '@/lib/api'

const ROLE_OPTIONS: { value: AssignableRole; label: string }[] = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'national_admin', label: 'National Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'Patient' },
]

const PASSWORD_HINT = 'At least 8 characters. Share it securely and ask the user to change it after first login.'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  role: z.enum(['user', 'doctor', 'national_admin', 'admin']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  specialization: z.string().optional(),
  affiliations: z.string().optional(),
  division: z.string().optional(),
  district: z.string().optional(),
  location: z.string().optional(),
  id_pic: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role !== 'doctor') return
  const required = ['specialization', 'division', 'district', 'location'] as const
  for (const field of required) {
    if (!data[field]?.trim() || data[field]!.trim().length < 2) {
      ctx.addIssue({ code: 'custom', path: [field], message: 'Required for doctors' })
    }
  }
})

type FormData = z.infer<typeof schema>

interface Props {
  onCreate: (payload: AdminUserCreate) => Promise<{ user?: User; error?: string }>
}

export function CreateUserDialog({ onCreate }: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [idPicName, setIdPicName] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'doctor' },
  })

  const role = watch('role')
  const division = watch('division')
  const isDoctor = role === 'doctor'

  const onRoleChange = (value: string) => {
    setValue('role', value as AssignableRole, { shouldValidate: true })
    if (value !== 'doctor') {
      setValue('id_pic', undefined)
      setIdPicName('')
    }
  }

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      reset({ role: 'doctor' })
      setServerError(null)
      setIdPicName('')
    }
  }

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    setServerError(null)
    const payload: AdminUserCreate = {
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      phone: data.phone || undefined,
      role: data.role,
      doctor_profile: data.role === 'doctor'
        ? {
            specialization: data.specialization!.trim(),
            affiliations: (data.affiliations ?? '').split(',').map((a) => a.trim()).filter(Boolean),
            division: data.division!.trim(),
            district: data.district!.trim(),
            location: data.location!.trim(),
            id_pic: data.id_pic || null,
          }
        : undefined,
    }
    const result = await onCreate(payload)
    setSubmitting(false)
    if (result.error) {
      if (/email/i.test(result.error)) {
        setError('email', { type: 'server', message: result.error })
      } else {
        setServerError(result.error)
      }
      return
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 shrink-0">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Create user
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a user</DialogTitle>
          <DialogDescription>
            The account is active immediately with the chosen role. No approval step.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <FieldWrapper label="Role" htmlFor="create-role" error={errors.role?.message}>
              <Select value={role} onValueChange={onRoleChange}>
                <SelectTrigger id="create-role" className="w-full" aria-invalid={!!errors.role}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Full Name" htmlFor="create-full_name" error={errors.full_name?.message}>
              <Input
                id="create-full_name"
                autoComplete="off"
                placeholder="Jane Doe"
                {...register('full_name')}
                aria-invalid={!!errors.full_name}
                aria-describedby={describedBy('create-full_name', { error: errors.full_name?.message })}
              />
            </FieldWrapper>
            <FieldWrapper label="Email" htmlFor="create-email" error={errors.email?.message}>
              <Input
                id="create-email"
                type="email"
                autoComplete="off"
                placeholder="person@example.com"
                {...register('email')}
                aria-invalid={!!errors.email}
                aria-describedby={describedBy('create-email', { error: errors.email?.message })}
              />
            </FieldWrapper>
            <FieldWrapper label="Phone (Optional)" htmlFor="create-phone">
              <Input id="create-phone" type="tel" inputMode="tel" placeholder="+8801XXXXXXXXX" {...register('phone')} />
            </FieldWrapper>
            <FieldWrapper
              label="Temporary password"
              htmlFor="create-password"
              hint={PASSWORD_HINT}
              error={errors.password?.message}
              className="md:col-span-2"
            >
              <PasswordInput
                id="create-password"
                autoComplete="new-password"
                placeholder="Create a temporary password"
                {...register('password')}
                aria-invalid={!!errors.password}
                aria-describedby={describedBy('create-password', { hint: PASSWORD_HINT, error: errors.password?.message })}
              />
            </FieldWrapper>
          </div>

          {isDoctor && (
            <DoctorDetailsSection
              register={register}
              errors={errors}
              division={division}
              onDivisionChange={(value) => setValue('division', value, { shouldValidate: true })}
              idPicName={idPicName}
              onIdPicChange={(value) => {
                setValue('id_pic', value?.dataUrl)
                setIdPicName(value?.name ?? '')
              }}
            />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating…
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
