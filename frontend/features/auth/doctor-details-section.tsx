'use client'

import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldWrapper, describedBy } from '@/components/ui/form-field'
import { BD_DIVISIONS } from '@/lib/bd-divisions'
import { IdPicDropzone } from './id-pic-dropzone'

/** Fields this section reads/writes; the page's form data is a superset. */
export interface DoctorFields {
  specialization?: string
  affiliations?: string
  division?: string
  district?: string
  location?: string
}

interface DoctorDetailsSectionProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  division: string | undefined
  onDivisionChange: (value: string) => void
  idPicName: string
  onIdPicChange: (value: { dataUrl: string; name: string } | null) => void
}

export function DoctorDetailsSection({
  register,
  errors,
  division,
  onDivisionChange,
  idPicName,
  onIdPicChange,
}: DoctorDetailsSectionProps) {
  const err = (name: keyof DoctorFields) => errors[name]?.message as string | undefined
  return (
    <section aria-labelledby="doctor-details-heading" className="space-y-4 border-t pt-6">
      <div>
        <h2 id="doctor-details-heading" className="text-base font-semibold">Doctor details</h2>
        <p className="text-sm text-muted-foreground">
          Admins use these to verify you and patients use them to find the right clinician.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FieldWrapper label="Specialization" htmlFor="specialization" error={err('specialization')}>
          <Input
            id="specialization"
            placeholder="e.g. Endocrinology"
            {...register('specialization')}
            aria-invalid={!!errors.specialization}
            aria-describedby={describedBy('specialization', { error: err('specialization') })}
          />
        </FieldWrapper>
        <FieldWrapper label="Affiliations (Optional)" htmlFor="affiliations">
          <Input
            id="affiliations"
            placeholder="Comma-separated hospitals / clinics"
            {...register('affiliations')}
          />
        </FieldWrapper>
        <FieldWrapper label="Division" htmlFor="division" error={err('division')}>
          <Select value={division ?? ''} onValueChange={onDivisionChange}>
            <SelectTrigger
              id="division"
              className="w-full"
              aria-invalid={!!errors.division}
              aria-describedby={describedBy('division', { error: err('division') })}
            >
              <SelectValue placeholder="Select a division" />
            </SelectTrigger>
            <SelectContent>
              {BD_DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldWrapper>
        <FieldWrapper label="District" htmlFor="district" error={err('district')}>
          <Input
            id="district"
            placeholder="e.g. Dhaka"
            {...register('district')}
            aria-invalid={!!errors.district}
            aria-describedby={describedBy('district', { error: err('district') })}
          />
        </FieldWrapper>
        <FieldWrapper
          label="Practice location"
          htmlFor="location"
          error={err('location')}
          className="md:col-span-2"
        >
          <Input
            id="location"
            placeholder="Chamber / hospital address"
            {...register('location')}
            aria-invalid={!!errors.location}
            aria-describedby={describedBy('location', { error: err('location') })}
          />
        </FieldWrapper>
      </div>
      <IdPicDropzone fileName={idPicName} onChange={onIdPicChange} />
    </section>
  )
}
