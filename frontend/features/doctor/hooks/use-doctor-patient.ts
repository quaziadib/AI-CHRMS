'use client'

import { useState, useEffect } from 'react'
import { doctorApi } from '@/lib/api'
import type { DoctorPatientProfile } from '@/lib/api'

export function useDoctorPatient(patientId: string) {
  const [patient, setPatient] = useState<DoctorPatientProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    doctorApi.getPatient(patientId)
      .then(({ data, error: err }) => {
        if (data) setPatient(data)
        if (err) setError(err)
      })
      .finally(() => setIsLoading(false))
  }, [patientId])

  return { patient, isLoading, error }
}
