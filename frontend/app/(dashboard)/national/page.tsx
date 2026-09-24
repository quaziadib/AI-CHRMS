'use client'

import { AlertTriangle, Globe, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useNationalRsgi } from '@/features/national/hooks/use-national-rsgi'
import { GeoFilterBar } from '@/features/national/components/geo-filter-bar'
import { SpatialRiskMatrix } from '@/features/national/components/spatial-risk-matrix'
import { DemographicsPrevalenceChart, DivisionPrevalenceChart } from '@/features/national/components/national-charts'
import { DistrictChoropleth } from '@/features/national/components/district-choropleth'
import { DivisionForecastExplorer } from '@/features/national/components/division-forecast-explorer'

export default function NationalDashboardPage() {
  const {
    divisions,
    districts,
    divisionId,
    districtId,
    spatial,
    divisionChart,
    demoChart,
    mapSummary,
    mapDivisionId,
    divisionForecast,
    forecastScopeId,
    isLoading,
    disabled,
    onDivisionChange,
    onDistrictChange,
    resetFilters,
    selectMapDivision,
    returnMapToNational,
    onForecastScopeChange,
    onGenerateDivisionForecast,
    divisionForecastDisabled,
    isRefreshingMap,
    refreshMapSummary,
  } = useNationalRsgi()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading national spatial intelligence…
      </div>
    )
  }

  if (disabled) {
    return (
      <div className="space-y-6">
        <Header />
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              National analytics disabled
            </CardTitle>
            <CardDescription>
              Enable <code>ENABLE_NATIONAL_ANALYTICS</code> on the API to load the live dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header />

      <Card>
        <CardHeader>
          <CardTitle>Geographic filters</CardTitle>
          <CardDescription>Filter at the division and district levels available in stored patient records.</CardDescription>
        </CardHeader>
        <CardContent>
          <GeoFilterBar
            divisions={divisions}
            districts={districts}
            divisionId={divisionId}
            districtId={districtId}
            onDivisionChange={onDivisionChange}
            onDistrictChange={onDistrictChange}
            onReset={resetFilters}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bangladesh burden map</CardTitle>
          <CardDescription>Explore privacy-safe submitted-record risk shares by division and district.</CardDescription>
        </CardHeader>
        <CardContent>
          <DistrictChoropleth
            data={mapSummary}
            selectedDivisionId={mapDivisionId}
            onSelectDivision={selectMapDivision}
            onReturnToNational={returnMapToNational}
            onRefresh={refreshMapSummary}
            isRefreshing={isRefreshingMap}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regional record metrics</CardTitle>
          <CardDescription>District summaries and cohort metrics calculated from scored records in the database.</CardDescription>
        </CardHeader>
        <CardContent>
          <SpatialRiskMatrix spatial={spatial} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Division high-risk share</CardTitle>
            <CardDescription>Share of scored submitted records classified as high risk, calculated from the database.</CardDescription>
          </CardHeader>
          <CardContent>
            <DivisionPrevalenceChart data={divisionChart} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>High-risk share by age and gender</CardTitle>
            <CardDescription>Database records grouped into age bands and gender; small cells are suppressed.</CardDescription>
          </CardHeader>
          <CardContent>
            <DemographicsPrevalenceChart data={demoChart} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stored division trends and forecasts</CardTitle>
          <CardDescription>View database aggregates and saved forecast jobs for a division.</CardDescription>
        </CardHeader>
        <CardContent>
          <DivisionForecastExplorer
            divisions={divisions}
            scopeId={forecastScopeId}
            forecast={divisionForecast}
            onScopeChange={onForecastScopeChange}
            onGenerate={onGenerateDivisionForecast}
            disabled={divisionForecastDisabled}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-full bg-emerald-50 p-2">
        <Globe className="h-6 w-6 text-emerald-700" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">National Health Dashboard</h1>
        <p className="text-muted-foreground">
          Spatial diabetes intelligence for Bangladesh, based on stored health-record aggregates
        </p>
      </div>
    </div>
  )
}
