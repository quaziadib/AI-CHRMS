'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Heart, Eye, EyeOff } from 'lucide-react'

import { getRoleHome, useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { BD_DIVISIONS } from '@/lib/bd-divisions'

const ID_PIC_MAX_BYTES = 1_000_000

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

  const onIdPicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setValue('id_pic', undefined)
      setIdPicName('')
      return
    }
    if (!file.type.startsWith('image/') || file.size > ID_PIC_MAX_BYTES) {
      toast.error('ID picture must be an image under 1 MB')
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setValue('id_pic', String(reader.result))
      setIdPicName(file.name)
    }
    reader.readAsDataURL(file)
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto flex items-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold">Health Project</span>
          </Link>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Choose your role. Doctor, National Admin, and Admin require admin approval.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                {...register('full_name')}
                aria-invalid={!!errors.full_name}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                {...register('email')}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                autoComplete="tel"
                {...register('phone')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) =>
                  setValue('role', value as RegisterFormData['role'], { shouldValidate: true })
                }
              >
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Patient</SelectItem>
                  <SelectItem value="doctor">Doctor (needs approval)</SelectItem>
                  <SelectItem value="national_admin">National Admin (needs approval)</SelectItem>
                  <SelectItem value="admin">Admin (needs approval)</SelectItem>
                </SelectContent>
              </Select>
              {selectedRole !== 'user' && (
                <p className="text-xs text-muted-foreground">
                  You can use the app as a patient until an admin approves this role.
                </p>
              )}
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>
            {selectedRole === 'doctor' && (
              <fieldset className="space-y-4 rounded-md border p-4">
                <legend className="px-1 text-sm font-medium">Doctor details</legend>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input id="specialization" placeholder="e.g. Endocrinology" {...register('specialization')} aria-invalid={!!errors.specialization} />
                  {errors.specialization && <p className="text-sm text-destructive">{errors.specialization.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="affiliations">Affiliations (Optional)</Label>
                  <Input id="affiliations" placeholder="Comma-separated hospitals / clinics" {...register('affiliations')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="division">Division</Label>
                  <Select
                    value={selectedDivision ?? ''}
                    onValueChange={(value) => setValue('division', value, { shouldValidate: true })}
                  >
                    <SelectTrigger id="division" className="w-full" aria-invalid={!!errors.division}>
                      <SelectValue placeholder="Select a division" />
                    </SelectTrigger>
                    <SelectContent>
                      {BD_DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.division && <p className="text-sm text-destructive">{errors.division.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input id="district" placeholder="e.g. Dhaka" {...register('district')} aria-invalid={!!errors.district} />
                  {errors.district && <p className="text-sm text-destructive">{errors.district.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Practice location</Label>
                  <Input id="location" placeholder="Chamber / hospital address" {...register('location')} aria-invalid={!!errors.location} />
                  {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_pic">ID picture (Optional)</Label>
                  <Input id="id_pic" type="file" accept="image/*" onChange={onIdPicChange} />
                  {idPicName && <p className="text-xs text-muted-foreground">{idPicName}</p>}
                  <p className="text-xs text-muted-foreground">Shown only to admins reviewing your request. Max 1 MB.</p>
                </div>
              </fieldset>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  {...register('password')}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  {...register('confirm_password')}
                  aria-invalid={!!errors.confirm_password}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
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
