'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { nationalApi } from '@/lib/api/national'
import type {
  DemographicsChart,
  DivisionChart,
  EpidemicForecastJob,
  GeoOption,
  IndividualPredictResponse,
  SpatialPanel,
} from '@/lib/api/national'

export function useNationalRsgi() {
  const [divisions, setDivisions] = useState<GeoOption[]>([])
  const [districts, setDistricts] = useState<GeoOption[]>([])
  const [upazillas, setUpazillas] = useState<GeoOption[]>([])
  const [thanas, setThanas] = useState<GeoOption[]>([])
  const [divisionId, setDivisionId] = useState('dhaka')
  const [districtId, setDistrictId] = useState<string>('')
  const [upazillaId, setUpazillaId] = useState('')
  const [thanaId, setThanaId] = useState('')
  const [spatial, setSpatial] = useState<SpatialPanel | null>(null)
  const [divisionChart, setDivisionChart] = useState<DivisionChart | null>(null)
  const [demoChart, setDemoChart] = useState<DemographicsChart | null>(null)
  const [prediction, setPrediction] = useState<IndividualPredictResponse | null>(null)
  const [epidemic, setEpidemic] = useState<EpidemicForecastJob | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [disabled, setDisabled] = useState(false)
  const [isPredicting, setIsPredicting] = useState(false)
  const [isForecasting, setIsForecasting] = useState(false)

  const loadGeoChildren = useCallback(async (div: string, dist?: string, upa?: string) => {
    const distRes = await nationalApi.getDistricts(div)
    const distItems = distRes.data?.items ?? []
    setDistricts(distItems)
    const nextDist = dist && distItems.some((d) => d.id === dist) ? dist : distItems[0]?.id ?? ''
    setDistrictId(nextDist)

    const upaRes = nextDist ? await nationalApi.getUpazillas(nextDist) : { data: { items: [] } }
    const upaItems = upaRes.data?.items ?? []
    setUpazillas(upaItems)
    const nextUpa = upa && upaItems.some((u) => u.id === upa) ? upa : upaItems[0]?.id ?? ''
    setUpazillaId(nextUpa)

    const thanaRes = nextUpa ? await nationalApi.getThanas(nextUpa) : { data: { items: [] } }
    const thanaItems = thanaRes.data?.items ?? []
    setThanas(thanaItems)
    setThanaId(thanaItems[0]?.id ?? '')
    return nextDist
  }, [])

  const refreshSpatial = useCallback(async (div: string, dist: string) => {
    const res = await nationalApi.getSpatial(div, dist || undefined)
    if (res.data) setSpatial(res.data)
  }, [])

  const loadCore = useCallback(async () => {
    setIsLoading(true)
    const [divRes, chartDiv, chartDemo, epidemicRes] = await Promise.all([
      nationalApi.getDivisions(),
      nationalApi.getDivisionChart(),
      nationalApi.getDemographicsChart(),
      nationalApi.getLatestEpidemicForecast(),
    ])

    if (divRes.status === 503) {
      setDisabled(true)
      setIsLoading(false)
      return
    }
    setDisabled(false)

    if (divRes.data) setDivisions(divRes.data.items)
    if (chartDiv.data) setDivisionChart(chartDiv.data)
    if (chartDemo.data) setDemoChart(chartDemo.data)
    if (epidemicRes.data) setEpidemic(epidemicRes.data)

    const nextDist = await loadGeoChildren('dhaka')
    await refreshSpatial('dhaka', nextDist)
    setIsLoading(false)
  }, [loadGeoChildren, refreshSpatial])

  useEffect(() => {
    loadCore()
  }, [loadCore])

  useEffect(() => {
    if (!epidemic || (epidemic.status !== 'pending' && epidemic.status !== 'running')) return
    const id = setInterval(async () => {
      const res = await nationalApi.getLatestEpidemicForecast()
      if (!res.data) return
      setEpidemic(res.data)
      if (res.data.status === 'completed') toast.success('Epidemic forecast ready')
      if (res.data.status === 'failed') {
        toast.error(res.data.error_message || 'Epidemic forecast failed')
      }
    }, 2500)
    return () => clearInterval(id)
  }, [epidemic])

  const onDivisionChange = async (id: string) => {
    setDivisionId(id)
    const nextDist = await loadGeoChildren(id)
    await refreshSpatial(id, nextDist)
  }

  const onDistrictChange = async (id: string) => {
    setDistrictId(id)
    const upaRes = await nationalApi.getUpazillas(id)
    const upaItems = upaRes.data?.items ?? []
    setUpazillas(upaItems)
    const nextUpa = upaItems[0]?.id ?? ''
    setUpazillaId(nextUpa)
    const thanaRes = nextUpa ? await nationalApi.getThanas(nextUpa) : { data: { items: [] } }
    setThanas(thanaRes.data?.items ?? [])
    setThanaId(thanaRes.data?.items?.[0]?.id ?? '')
    await refreshSpatial(divisionId, id)
  }

  const onUpazillaChange = async (id: string) => {
    setUpazillaId(id)
    const thanaRes = await nationalApi.getThanas(id)
    setThanas(thanaRes.data?.items ?? [])
    setThanaId(thanaRes.data?.items?.[0]?.id ?? '')
  }

  const resetFilters = async () => {
    setDivisionId('dhaka')
    const nextDist = await loadGeoChildren('dhaka')
    await refreshSpatial('dhaka', nextDist)
  }

  const runPrediction = async (body: {
    age: number
    gender: string
    bmi: number
    glucose: number
    family_history: string
    activity: string
  }) => {
    setIsPredicting(true)
    const res = await nationalApi.predictIndividual(body)
    if (res.error) toast.error(res.error)
    else if (res.data) setPrediction(res.data)
    setIsPredicting(false)
  }

  const runEpidemicForecast = async () => {
    setIsForecasting(true)
    const res = await nationalApi.enqueueEpidemicForecast()
    if (res.error) toast.error(res.error)
    else if (res.data) {
      setEpidemic(res.data)
      toast.success('LLM epidemic forecast started')
    }
    setIsForecasting(false)
  }

  return {
    divisions,
    districts,
    upazillas,
    thanas,
    divisionId,
    districtId,
    upazillaId,
    thanaId,
    setThanaId,
    spatial,
    divisionChart,
    demoChart,
    prediction,
    epidemic,
    isLoading,
    disabled,
    isPredicting,
    isForecasting,
    onDivisionChange,
    onDistrictChange,
    onUpazillaChange,
    resetFilters,
    runPrediction,
    runEpidemicForecast,
  }
}
