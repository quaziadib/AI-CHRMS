'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { RiskFilter } from '@/features/doctor/components/risk-filter'
import { PatientList } from '@/features/doctor/components/patient-list'
import { useDoctorPatients } from '@/features/doctor/hooks/use-doctor-patients'

export default function DoctorPatientsPage() {
  const [riskFilter, setRiskFilter] = useState('')
  const { patients, isLoading } = useDoctorPatients(riskFilter || undefined)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-muted-foreground">
            Patients who have granted you access. Select a row to open their record.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <RiskFilter value={riskFilter} onChange={setRiskFilter} />
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {patients.length} patient{patients.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <PatientList patients={patients} isLoading={isLoading} />
      )}
    </div>
  )
}
