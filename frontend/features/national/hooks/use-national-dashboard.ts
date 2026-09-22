'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { nationalApi } from '@/lib/api/national'
import type {
  DistrictSummary,
  PatternInsight,
  PopulationForecastJob,
  ResourceEstimate,
} from '@/lib/api/national'

export function useNationalDashboard() {
  const [districts, setDistricts] = useState<DistrictSummary[]>([])
  const [resources, setResources] = useState<ResourceEstimate[]>([])
  const [forecast, setForecast] = useState<PopulationForecastJob | null>(null)
  const [insights, setInsights] = useState<PatternInsight[]>([])
  const [insufficientPatterns, setInsufficientPatterns] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isForecasting, setIsForecasting] = useState(false)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [minCellSize, setMinCellSize] = useState(5)

  const loadCore = useCallback(async () => {
    setIsLoading(true)
    const [summaryRes, resourcesRes, forecastRes] = await Promise.all([
      nationalApi.getDistrictSummary(),
      nationalApi.getResources(),
      nationalApi.getLatestForecast(),
    ])

    if (summaryRes.status === 503 || resourcesRes.status === 503) {
      setDisabled(true)
      setIsLoading(false)
      return
    }
    setDisabled(false)

    if (summaryRes.error) {
      toast.error(summaryRes.error)
    } else if (summaryRes.data) {
      setDistricts(summaryRes.data.districts)
      setMinCellSize(summaryRes.data.min_cell_size)
    }

    if (resourcesRes.data) {
      setResources(resourcesRes.data.resources)
    }

    if (forecastRes.data) {
      setForecast(forecastRes.data)
    } else if (forecastRes.status !== 404 && forecastRes.status !== 503) {
      // ignore missing latest forecast
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadCore()
  }, [loadCore])

  useEffect(() => {
    if (!forecast || (forecast.status !== 'pending' && forecast.status !== 'running')) return
    const id = setInterval(async () => {
      const res = await nationalApi.getLatestForecast()
      if (res.data) {
        setForecast(res.data)
        if (res.data.status === 'completed' || res.data.status === 'failed') {
          const resourcesRes = await nationalApi.getResources()
          if (resourcesRes.data) setResources(resourcesRes.data.resources)
        }
      }
    }, 2000)
    return () => clearInterval(id)
  }, [forecast])

  const exportCsv = async () => {
    setIsExporting(true)
    const { error } = await nationalApi.exportCsv()
    if (error) toast.error(error)
    else toast.success('Export downloaded')
    setIsExporting(false)
  }

  const runForecast = async () => {
    setIsForecasting(true)
    const res = await nationalApi.enqueueForecast()
    if (res.error) {
      toast.error(res.error)
    } else if (res.data) {
      setForecast(res.data)
      toast.success('Population forecast started')
    }
    setIsForecasting(false)
  }

  const runPatterns = async () => {
    setIsDiscovering(true)
    const res = await nationalApi.discoverPatterns()
    if (res.status === 503) {
      toast.error('Pattern discovery is disabled')
    } else if (res.error) {
      toast.error(res.error)
    } else if (res.data) {
      setInsights(res.data.insights)
      setInsufficientPatterns(res.data.insufficient_data)
      if (res.data.insufficient_data) {
        toast.message('Not enough anonymized data for patterns yet')
      }
    }
    setIsDiscovering(false)
  }

  return {
    districts,
    resources,
    forecast,
    insights,
    insufficientPatterns,
    isLoading,
    isExporting,
    isForecasting,
    isDiscovering,
    disabled,
    minCellSize,
    refresh: loadCore,
    exportCsv,
    runForecast,
    runPatterns,
  }
}
