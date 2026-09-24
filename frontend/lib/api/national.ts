import { api } from './client'

export type GeoOption = { id: string; name: string }

export type DistrictSummary = {
  district: string
  suppressed: boolean
  record_count: number | null
  low_risk: number | null
  moderate_risk: number | null
  high_risk: number | null
  unscored: number | null
  high_risk_rate: number | null
  latest_record_at: string | null
}

export type DistrictSummaryResponse = {
  districts: DistrictSummary[]
  generated_at: string
  min_cell_size: number
}

export type ResourceEstimate = {
  district: string
  suppressed: boolean
  projected_high_risk: number | null
  testing_kits: number | null
  medicine_packs: number | null
  clinic_sites: number | null
  source: string
}

export type ResourceAllocationResponse = {
  resources: ResourceEstimate[]
  generated_at: string
}

export type PopulationForecastJob = {
  id: string
  status: string
  result: {
    districts?: Array<{
      district: string
      status: string
      model: string
      high_risk_6m: number | null
      high_risk_12m: number | null
      record_count_6m: number | null
      record_count_12m: number | null
    }>
  } | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export type PatternInsight = {
  statement: string
  caveat: string | null
}

export type PatternDiscoveryResponse = {
  insights: PatternInsight[]
  generated_at: string
  insufficient_data: boolean
}

export type SpatialPanel = {
  title: string
  division_id: string
  district_id: string | null
  hotspots: Array<{ label: string; rate: number; severity: string; source: string }>
  metrics: {
    prevalence_growth_yoy_percent: number
    avg_diagnosis_age: number
    screening_coverage_percent: number
  }
  synthesis: boolean
}

export type DivisionChart = {
  labels: string[]
  prevalence_percent: Array<number | null>
  national_benchmark_percent: number
  empty: boolean
}

export type DemographicsChart = {
  labels: string[]
  male_prevalence_percent: Array<number | null>
  female_prevalence_percent: Array<number | null>
  empty: boolean
}

export type IndividualPredictRequest = {
  age: number
  gender: string
  bmi: number
  glucose: number
  family_history: string
  activity: string
}

export type IndividualPredictResponse = {
  probability_percent: number
  risk_level: string
  category_label: string
  confidence_percent: number
  top_factors: string[]
  engine: string
  persisted: boolean
}

export type EpidemicForecastJob = {
  id: string
  status: string
  result: {
    forecast_kind?: string
    pending?: boolean
    engine?: string
    summary?: string
    series?: Array<{
      year: number
      urban_prevalence_percent: number
      rural_prevalence_percent: number
    }>
    risk_groups?: Array<{
      key: string
      label: string
      population_share_percent: number
      guidance: string
    }>
  } | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

const ACCESS_TOKEN_KEY = 'health_access_token'

async function downloadCsv(): Promise<{ error?: string }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null
  try {
    const res = await fetch('/v1/national/export.csv', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return { error: (body as { detail?: string }).detail || `Export failed (${res.status})` }
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'national-district-summary.csv'
    a.click()
    URL.revokeObjectURL(url)
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Network error' }
  }
}

export const nationalApi = {
  getDivisions: () => api.get<{ items: GeoOption[] }>('/national/geo/divisions'),
  getDistricts: (divisionId: string) =>
    api.get<{ items: GeoOption[] }>(`/national/geo/districts?division_id=${encodeURIComponent(divisionId)}`),
  getUpazillas: (districtId: string) =>
    api.get<{ items: GeoOption[] }>(`/national/geo/upazillas?district_id=${encodeURIComponent(districtId)}`),
  getThanas: (upazillaId: string) =>
    api.get<{ items: GeoOption[] }>(`/national/geo/thanas?upazilla_id=${encodeURIComponent(upazillaId)}`),
  getSpatial: (divisionId: string, districtId?: string) => {
    const q = new URLSearchParams({ division_id: divisionId })
    if (districtId) q.set('district_id', districtId)
    return api.get<SpatialPanel>(`/national/spatial?${q}`)
  },
  getDivisionChart: () => api.get<DivisionChart>('/national/charts/divisions'),
  getDemographicsChart: () => api.get<DemographicsChart>('/national/charts/demographics'),
  predictIndividual: (body: IndividualPredictRequest) =>
    api.post<IndividualPredictResponse>('/national/predict-individual', body),
  enqueueEpidemicForecast: () => api.post<EpidemicForecastJob>('/national/epidemic-forecast'),
  getLatestEpidemicForecast: () => api.get<EpidemicForecastJob>('/national/epidemic-forecast/latest'),
  getDistrictSummary: () => api.get<DistrictSummaryResponse>('/national/districts/summary'),
  getResources: () => api.get<ResourceAllocationResponse>('/national/resources'),
  exportCsv: downloadCsv,
  enqueueForecast: () => api.post<PopulationForecastJob>('/national/forecasts'),
  getLatestForecast: () => api.get<PopulationForecastJob>('/national/forecasts/latest'),
  discoverPatterns: () => api.post<PatternDiscoveryResponse>('/national/patterns'),
}
