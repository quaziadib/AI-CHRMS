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

export type NationalMapMetric = {
  id: string
  name: string
  status: 'available' | 'awaiting_scores' | 'suppressed' | 'unavailable'
  high_risk_share: number | null
}

export type NationalMapSummary = {
  generated_at: string
  metric_basis: string
  minimum_cell_size: number
  attribution: string
  divisions: NationalMapMetric[]
  districts: NationalMapMetric[]
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
  districts: Array<{ label: string; rate: number; severity: string; source: 'database' }>
  metrics: {
    high_risk_share_change_yoy_percentage_points: number | null
    mean_record_age_years: number | null
    screening_coverage_percent: number | null
  }
  metric_basis: string
}

export type DivisionChart = {
  labels: string[]
  high_risk_share_percent: Array<number | null>
  national_high_risk_share_percent: number | null
  empty: boolean
}

export type DemographicsChart = {
  labels: string[]
  male_high_risk_share_percent: Array<number | null>
  female_high_risk_share_percent: Array<number | null>
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

export type DivisionForecastPoint = {
  year: number
  value: number | null
  kind: 'observed' | 'projected' | 'unavailable'
  source: string | null
}

export type DivisionForecastJob = {
  id: string
  status: string
  result: {
    forecast_kind?: string
    scope_id?: string
    engine?: string
    metric_basis?: string
    minimum_cell_size?: number
    display_years?: number[]
    projection_start_year?: number | null
    urban_rural_status?: string
    summary?: string
    series?: Array<{
      id: string
      name: string
      status: string
      urban_rural_status: string
      points: DivisionForecastPoint[]
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
  enqueueDivisionForecast: (scopeId: string) => api.post<DivisionForecastJob>('/national/division-forecasts', { scope_id: scopeId }),
  getLatestDivisionForecast: (scopeId: string) =>
    api.get<DivisionForecastJob>(`/national/division-forecasts/latest?scope_id=${encodeURIComponent(scopeId)}`),
  getDistrictSummary: () => api.get<DistrictSummaryResponse>('/national/districts/summary'),
  getMapSummary: () => api.get<NationalMapSummary>('/national/map/summary'),
  getResources: () => api.get<ResourceAllocationResponse>('/national/resources'),
  exportCsv: downloadCsv,
  enqueueForecast: () => api.post<PopulationForecastJob>('/national/forecasts'),
  getLatestForecast: () => api.get<PopulationForecastJob>('/national/forecasts/latest'),
  discoverPatterns: () => api.post<PatternDiscoveryResponse>('/national/patterns'),
}
