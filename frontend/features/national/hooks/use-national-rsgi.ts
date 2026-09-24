'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { nationalApi } from '@/lib/api/national'
import type {
  DemographicsChart,
  DivisionForecastJob,
  DivisionChart,
  GeoOption,
  NationalMapSummary,
  SpatialPanel,
} from '@/lib/api/national'

export function useNationalRsgi() {
  const [divisions, setDivisions] = useState<GeoOption[]>([])
  const [districts, setDistricts] = useState<GeoOption[]>([])
  const [divisionId, setDivisionId] = useState('')
  const [districtId, setDistrictId] = useState<string>('')
  const [spatial, setSpatial] = useState<SpatialPanel | null>(null)
  const [divisionChart, setDivisionChart] = useState<DivisionChart | null>(null)
  const [demoChart, setDemoChart] = useState<DemographicsChart | null>(null)
  const [divisionForecast, setDivisionForecast] = useState<DivisionForecastJob | null>(null)
  const [forecastScopeId, setForecastScopeId] = useState('all')
  const [mapSummary, setMapSummary] = useState<NationalMapSummary | null>(null)
  const [mapDivisionId, setMapDivisionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [disabled, setDisabled] = useState(false)
  const [divisionForecastDisabled, setDivisionForecastDisabled] = useState(false)
  const [isRefreshingMap, setIsRefreshingMap] = useState(false)
  const filterRequest = useRef(0)
  const forecastRequest = useRef(0)

  const refreshMapSummary = useCallback(async () => {
    setIsRefreshingMap(true)
    try {
      const res = await nationalApi.getMapSummary()
      if (res.data) setMapSummary(res.data)
      else if (res.error) toast.error(res.error)
    } finally {
      setIsRefreshingMap(false)
    }
  }, [])

  const loadGeoChildren = useCallback(async (div: string, requestId: number) => {
    const distRes = await nationalApi.getDistricts(div)
    if (requestId !== filterRequest.current) return
    const distItems = distRes.data?.items ?? []
    setDistricts(distItems)
    setDistrictId('')
  }, [])

  const refreshSpatial = useCallback(async (div: string, dist: string, requestId: number) => {
    const res = await nationalApi.getSpatial(div, dist || undefined)
    if (requestId === filterRequest.current && res.data) setSpatial(res.data)
  }, [])

  const loadCore = useCallback(async () => {
    const [divRes, chartDiv, chartDemo, mapRes, divisionForecastRes] = await Promise.all([
      nationalApi.getDivisions(),
      nationalApi.getDivisionChart(),
      nationalApi.getDemographicsChart(),
      nationalApi.getMapSummary(),
      nationalApi.getLatestDivisionForecast('all'),
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
    if (mapRes.data) setMapSummary(mapRes.data)
    if (divisionForecastRes.data) setDivisionForecast(divisionForecastRes.data)
    setDivisionForecastDisabled(divisionForecastRes.status === 503)

    setDistricts([])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // This loader only updates component state after its API requests resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCore()
  }, [loadCore])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshMapSummary()
    }
    const intervalId = window.setInterval(refreshWhenVisible, 30_000)
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [refreshMapSummary])

  useEffect(() => {
    if (!divisionForecast || (divisionForecast.status !== 'pending' && divisionForecast.status !== 'running')) return
    const scope = forecastScopeId
    const requestId = forecastRequest.current
    const id = setInterval(async () => {
      const res = await nationalApi.getLatestDivisionForecast(scope)
      if (requestId !== forecastRequest.current || !res.data) return
      setDivisionForecast(res.data)
      if (res.data.status === 'completed') toast.success('Division forecast ready')
      if (res.data.status === 'failed') toast.error(res.data.error_message || 'Division forecast failed')
    }, 2500)
    return () => clearInterval(id)
  }, [divisionForecast, forecastScopeId])

  const onDivisionChange = async (id: string) => {
    const filterRequestId = ++filterRequest.current
    const forecastRequestId = ++forecastRequest.current
    setDivisionId(id)
    setMapDivisionId(id || null)
    const scopeId = id || 'all'
    setForecastScopeId(scopeId)
    const forecastRes = await nationalApi.getLatestDivisionForecast(scopeId)
    if (forecastRequestId !== forecastRequest.current) return
    setDivisionForecast(forecastRes.data ?? null)
    setDivisionForecastDisabled(forecastRes.status === 503)
    if (!id) {
      setDistricts([])
      setDistrictId('')
      setSpatial(null)
      return
    }
    await loadGeoChildren(id, filterRequestId)
    await refreshSpatial(id, '', filterRequestId)
  }

  const onDistrictChange = async (id: string) => {
    const requestId = ++filterRequest.current
    setDistrictId(id)
    await refreshSpatial(divisionId, id, requestId)
  }

  const resetFilters = async () => {
    filterRequest.current += 1
    const forecastRequestId = ++forecastRequest.current
    setDivisionId('')
    setMapDivisionId(null)
    setForecastScopeId('all')
    const forecastRes = await nationalApi.getLatestDivisionForecast('all')
    if (forecastRequestId !== forecastRequest.current) return
    setDivisionForecast(forecastRes.data ?? null)
    setDivisionForecastDisabled(forecastRes.status === 503)
    setDistricts([])
    setDistrictId('')
    setSpatial(null)
  }

  const selectMapDivision = async (id: string) => {
    setMapDivisionId(id)
    await onDivisionChange(id)
  }

  const returnMapToNational = async () => {
    await resetFilters()
  }

  const onForecastScopeChange = async (scopeId: string) => {
    const requestId = ++forecastRequest.current
    setForecastScopeId(scopeId)
    setDivisionForecast(null)
    const res = await nationalApi.getLatestDivisionForecast(scopeId)
    if (requestId !== forecastRequest.current) return
    setDivisionForecast(res.data ?? null)
    setDivisionForecastDisabled(res.status === 503)
  }

  const onGenerateDivisionForecast = async () => {
    const requestId = ++forecastRequest.current
    const scopeId = forecastScopeId
    const res = await nationalApi.enqueueDivisionForecast(scopeId)
    if (requestId !== forecastRequest.current) return
    if (res.data) {
      setDivisionForecast(res.data)
      return
    }
    setDivisionForecastDisabled(res.status === 503)
    toast.error(res.error || 'Could not start the division forecast')
  }

  return {
    divisions,
    districts,
    divisionId,
    districtId,
    spatial,
    divisionChart,
    demoChart,
    divisionForecast,
    forecastScopeId,
    mapSummary,
    mapDivisionId,
    isLoading,
    disabled,
    divisionForecastDisabled,
    isRefreshingMap,
    onDivisionChange,
    onDistrictChange,
    resetFilters,
    selectMapDivision,
    returnMapToNational,
    onForecastScopeChange,
    onGenerateDivisionForecast,
    refreshMapSummary,
  }
}
