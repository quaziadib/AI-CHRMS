'use client'

import { useState, useEffect } from 'react'
import { doctorApi } from '@/lib/api'
import type { PatientRecord } from '@/lib/api'

export function useDoctorPatient(recordId: string) {
  const [patient, setPatient] = useState<PatientRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    doctorApi.getPatient(recordId)
      .then(({ data, error: err }) => {
        if (data) setPatient(data)
        if (err) setError(err)
      })
      .finally(() => setIsLoading(false))
  }, [recordId])

  return { patient, isLoading, error }
}
