'use client'

import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { RiskFilter } from '@/features/doctor/components/risk-filter'
import { LocationFilter } from '@/features/doctor/components/location-filter'
import { PatientList } from '@/features/doctor/components/patient-list'
import { useDoctorPatients } from '@/features/doctor/hooks/use-doctor-patients'

export default function DoctorPatientsPage() {
  const [riskFilter, setRiskFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')

  const { patients: optionSource } = useDoctorPatients()
  const { patients, isLoading } = useDoctorPatients({
    risk_level: riskFilter || undefined,
    district: districtFilter || undefined,
  })

  const districtOptions = useMemo(() => {
    const districts = new Set<string>()
    for (const patient of optionSource) {
      const district = patient.latest_record?.district?.trim()
      if (district) districts.add(district)
    }
    return Array.from(districts).sort((a, b) => a.localeCompare(b))
  }, [optionSource])

  const filtersActive = Boolean(riskFilter || districtFilter)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50">
          <Users className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patients</h1>
          <p className="text-muted-foreground">
            Patients who have granted you access. Filter by risk or district, then select a row to open their record.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <RiskFilter value={riskFilter} onChange={setRiskFilter} />
          <LocationFilter
            value={districtFilter}
            options={districtOptions}
            onChange={setDistrictFilter}
          />
        </div>
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {patients.length} patient{patients.length !== 1 ? 's' : ''}
            {filtersActive ? ' matching filters' : ''}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <PatientList
          patients={patients}
          isLoading={isLoading}
          emptyTitle={filtersActive ? 'No patients match these filters' : undefined}
          emptyDescription={
            filtersActive
              ? 'Try clearing the district or risk filter to see more of your accessible patients.'
              : undefined
          }
        />
      )}
    </div>
  )
}
