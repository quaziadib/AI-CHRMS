'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Heart } from 'lucide-react'

import { getRoleHome, useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldWrapper, describedBy } from '@/components/ui/form-field'
import { Spinner } from '@/components/ui/spinner'
import { DoctorDetailsSection } from '@/features/auth/doctor-details-section'
import { PasswordInput } from '@/features/auth/password-input'
import { RoleSelector } from '@/features/auth/role-selector'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  role: z.enum(['user', 'doctor', 'national_admin', 'admin']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
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
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
})

const PASSWORD_HINT = 'At least 8 characters.'

type RegisterFormData = z.infer<typeof registerSchema>

const ROLE_LABELS: Record<RegisterFormData['role'], string> = {
  user: 'Patient',
  doctor: 'Doctor',
  national_admin: 'National Admin',
  admin: 'Admin',
}

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [idPicName, setIdPicName] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'user' },
  })

  const selectedRole = watch('role')
  const selectedDivision = watch('division')

  const onRoleChange = (role: RegisterFormData['role']) => {
    setValue('role', role, { shouldValidate: true })
    if (role !== 'doctor') {
      setValue('id_pic', undefined)
      setIdPicName('')
    }
  }

  const onIdPicChange = (value: { dataUrl: string; name: string } | null) => {
    setValue('id_pic', value?.dataUrl)
    setIdPicName(value?.name ?? '')
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const result = await registerUser({
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
      })
      if (result.success) {
        if (result.user?.role_request_status === 'pending') {
          toast.success(
            `${ROLE_LABELS[data.role]} access requested. An admin must approve before that role is active.`,
          )
          router.push('/dashboard')
        } else {
          toast.success('Account created successfully!')
          router.push(getRoleHome(result.user?.roles))
        }
      } else {
        toast.error(result.error || 'Registration failed')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isDoctor = selectedRole === 'doctor'

  return (
    <div className="min-h-screen flex items-start justify-center bg-muted/30 px-4 py-10 md:items-center md:py-12">
      <Card
        className={cn(
          'w-full transition-[max-width] duration-300 motion-reduce:transition-none',
          isDoctor ? 'max-w-3xl' : 'max-w-2xl',
        )}
      >
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto flex items-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-primary" aria-hidden="true" />
            <span className="text-xl font-semibold">Health Project</span>
          </Link>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Start as a patient, or request a professional role. Professional roles are reviewed by an admin.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-8">
            <fieldset className="space-y-3">
              <legend className="mb-3 text-base font-semibold">I am signing up as</legend>
              <RoleSelector value={selectedRole} onChange={onRoleChange} />
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="mb-3 text-base font-semibold">Your account</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <FieldWrapper label="Full Name" htmlFor="full_name" error={errors.full_name?.message}>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    {...register('full_name')}
                    aria-invalid={!!errors.full_name}
                    aria-describedby={describedBy('full_name', { error: errors.full_name?.message })}
                  />
                </FieldWrapper>
                <FieldWrapper label="Phone (Optional)" htmlFor="phone">
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="+8801XXXXXXXXX"
                    autoComplete="tel"
                    {...register('phone')}
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Email"
                  htmlFor="email"
                  error={errors.email?.message}
                  className="md:col-span-2"
                >
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register('email')}
                    aria-invalid={!!errors.email}
                    aria-describedby={describedBy('email', { error: errors.email?.message })}
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Password"
                  htmlFor="password"
                  hint={PASSWORD_HINT}
                  error={errors.password?.message}
                >
                  <PasswordInput
                    id="password"
                    placeholder="Create a password"
                    autoComplete="new-password"
                    {...register('password')}
                    aria-invalid={!!errors.password}
                    aria-describedby={describedBy('password', {
                      hint: PASSWORD_HINT,
                      error: errors.password?.message,
                    })}
                  />
                </FieldWrapper>
                <FieldWrapper
                  label="Confirm Password"
                  htmlFor="confirm_password"
                  error={errors.confirm_password?.message}
                >
                  <PasswordInput
                    id="confirm_password"
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    {...register('confirm_password')}
                    aria-invalid={!!errors.confirm_password}
                    aria-describedby={describedBy('confirm_password', {
                      error: errors.confirm_password?.message,
                    })}
                  />
                </FieldWrapper>
              </div>
            </fieldset>

            {isDoctor && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none">
                <DoctorDetailsSection
                  register={register}
                  errors={errors}
                  division={selectedDivision}
                  onDivisionChange={(value) => setValue('division', value, { shouldValidate: true })}
                  idPicName={idPicName}
                  onIdPicChange={onIdPicChange}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
