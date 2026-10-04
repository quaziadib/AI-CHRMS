'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { sharingApi } from '@/lib/api'
import type { DoctorSearchBy } from '@/lib/api'

const PAGE_SIZE = 10
const ALL = '__all__'

const SEARCH_BY_OPTIONS: { value: DoctorSearchBy; label: string }[] = [
  { value: 'all', label: 'All fields' },
  { value: 'name', label: 'Name' },
  { value: 'email', label: 'Email' },
  { value: 'specialization', label: 'Specialization' },
  { value: 'affiliation', label: 'Affiliation' },
  { value: 'location', label: 'Location' },
]

interface Props {
  selectedId: string
  onSelect: (doctorId: string) => void
}

function FilterSelect({ label, value, options, onChange }: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <Select value={value || ALL} onValueChange={(next) => onChange(next === ALL ? '' : next)}>
      <SelectTrigger className="w-full sm:w-[180px]" aria-label={`Filter by ${label.toLowerCase()}`}>
        <SelectValue placeholder={`All ${label.toLowerCase()}s`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label.toLowerCase()}s</SelectItem>
        {options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function DoctorPicker({ selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchBy, setSearchBy] = useState<DoctorSearchBy>('all')
  const [specialization, setSpecialization] = useState('')
  const [division, setDivision] = useState('')
  const [district, setDistrict] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const { data: filters } = useSWR('doctor-filters', async () => {
    const res = await sharingApi.getDoctorFilters()
    if (!res.data) throw new Error(res.error ?? 'Could not load filters')
    return res.data
  })

  const { data, error, isLoading } = useSWR(
    ['doctor-search', debouncedQuery, searchBy, specialization, division, district, page],
    async () => {
      const res = await sharingApi.searchDoctors({
        q: debouncedQuery, search_by: searchBy, specialization, division, district,
        limit: PAGE_SIZE, offset: page * PAGE_SIZE,
      })
      if (!res.data) throw new Error(res.error ?? 'Could not search doctors')
      return res.data
    },
    { keepPreviousData: true },
  )

  useEffect(() => {
    if (!selectedId || !data) return
    if (!data.items.some((doctor) => doctor.id === selectedId)) onSelect('')
  }, [data, selectedId, onSelect])

  const resetPage = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value)
    setPage(0)
  }
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => { setQuery(event.target.value); setPage(0) }}
          placeholder="Search doctors"
          aria-label="Search doctors"
          maxLength={100}
        />
        <Select value={searchBy} onValueChange={(v) => resetPage(setSearchBy)(v as DoctorSearchBy)}>
          <SelectTrigger className="w-full sm:w-[160px]" aria-label="Search by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_BY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <FilterSelect label="Specialization" value={specialization} options={filters?.specializations ?? []} onChange={resetPage(setSpecialization)} />
        <FilterSelect label="Division" value={division} options={filters?.divisions ?? []} onChange={resetPage(setDivision)} />
        <FilterSelect label="District" value={district} options={filters?.districts ?? []} onChange={resetPage(setDistrict)} />
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : isLoading && !data ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : data && data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No doctors match your search.</p>
      ) : (
        <ul className="divide-y rounded-md border" role="listbox" aria-label="Doctors">
          {data?.items.map((doctor) => {
            const selected = doctor.id === selectedId
            return (
              <li key={doctor.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => onSelect(selected ? '' : doctor.id)}
                  className={`w-full p-3 text-left text-sm hover:bg-muted/50 ${selected ? 'bg-muted' : ''}`}
                >
                  <p className="font-medium">{doctor.full_name}</p>
                  <p className="text-muted-foreground">
                    {[doctor.specialization, doctor.district, doctor.division].filter(Boolean).join(' · ') || doctor.email}
                  </p>
                  {doctor.affiliations.length > 0 && (
                    <p className="text-xs text-muted-foreground">{doctor.affiliations.join(', ')}</p>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm">
          <button type="button" className="underline disabled:opacity-40 disabled:no-underline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="text-muted-foreground">Page {page + 1} of {pageCount} · {total} doctors</span>
          <button type="button" className="underline disabled:opacity-40 disabled:no-underline" disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  )
}
