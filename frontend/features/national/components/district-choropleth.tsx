'use client'

import { useEffect, useMemo, useRef, useState, type SetStateAction } from 'react'
import { Loader2, Minus, Plus, RefreshCw, RotateCcw } from 'lucide-react'
import type { NationalMapMetric, NationalMapSummary } from '@/lib/api/national'

type Shape = { id: string; name: string; path: string; division_id?: string }
type BoundaryAsset = {
  metadata: { attribution: string }
  viewBox: number[]
  divisions: Record<string, Shape>
  districts: Record<string, Shape>
}
type MapView = { scale: number; x: number; y: number }
type DragStart = { x: number; y: number; viewX: number; viewY: number; clientX: number; clientY: number }
const INITIAL_MAP_VIEW: MapView = { scale: 1, x: 0, y: 0 }

type Props = {
  data: NationalMapSummary | null
  selectedDivisionId: string | null
  onSelectDivision: (divisionId: string) => void
  onReturnToNational: () => void
  onRefresh: () => void
  isRefreshing: boolean
}

function fill(metric?: NationalMapMetric) {
  if (!metric || metric.status === 'unavailable') return '#e5e7eb'
  if (metric.status === 'suppressed') return '#cbd5e1'
  if (metric.status === 'awaiting_scores') return '#fbbf24'
  const share = metric.high_risk_share ?? 0
  if (share >= 0.4) return '#b91c1c'
  if (share >= 0.25) return '#ea580c'
  if (share >= 0.1) return '#ca8a04'
  return '#16a34a'
}

function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const point = svg.createSVGPoint()
  point.x = clientX
  point.y = clientY
  const matrix = svg.getScreenCTM()
  return matrix ? point.matrixTransform(matrix.inverse()) : point
}

function clampView(view: MapView, viewBox: number[]): MapView {
  const [minX, minY, width, height] = viewBox
  const scale = Math.min(8, Math.max(1, view.scale))
  return {
    scale,
    x: Math.min(minX * (1 - scale), Math.max((minX + width) * (1 - scale), view.x)),
    y: Math.min(minY * (1 - scale), Math.max((minY + height) * (1 - scale), view.y)),
  }
}

export function DistrictChoropleth({ data, selectedDivisionId, onSelectDivision, onReturnToNational, onRefresh, isRefreshing }: Props) {
  const [geometry, setGeometry] = useState<BoundaryAsset | null>(null)
  const [active, setActive] = useState<NationalMapMetric | null>(null)
  const [scopedMapView, setScopedMapView] = useState({ divisionId: selectedDivisionId, view: INITIAL_MAP_VIEW })
  const mapView = scopedMapView.divisionId === selectedDivisionId ? scopedMapView.view : INITIAL_MAP_VIEW
  const setMapView = (next: SetStateAction<MapView>) => {
    setScopedMapView((current) => ({
      divisionId: selectedDivisionId,
      view: typeof next === 'function'
        ? next(current.divisionId === selectedDivisionId ? current.view : INITIAL_MAP_VIEW)
        : next,
    }))
  }
  const [isDragging, setIsDragging] = useState(false)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragStart = useRef<DragStart | null>(null)
  const dragged = useRef(false)
  const isDrilled = Boolean(selectedDivisionId)
  const metrics = useMemo(() => new Map(
    (isDrilled ? data?.districts ?? [] : data?.divisions ?? []).map((metric) => [metric.id, metric]),
  ), [data, isDrilled])

  useEffect(() => {
    let cancelled = false
    fetch('/data/bangladesh-admin-boundaries.json')
      .then((response) => response.ok ? response.json() as Promise<BoundaryAsset> : null)
      .then((asset) => { if (!cancelled && asset) setGeometry(asset) })
      .catch(() => { if (!cancelled) setGeometry(null) })
    return () => { cancelled = true }
  }, [])

  const shapes = isDrilled
    ? Object.values(geometry?.districts ?? {}).filter((shape) => shape.division_id === selectedDivisionId)
    : Object.values(geometry?.divisions ?? {})
  const districtsInScope = new Set(
    Object.values(geometry?.districts ?? {})
      .filter((shape) => shape.division_id === selectedDivisionId)
      .map((shape) => shape.id),
  )
  const rows = isDrilled
    ? (data?.districts ?? []).filter((metric) => districtsInScope.has(metric.id) && metric.status !== 'unavailable')
    : []
  const title = isDrilled
    ? `${geometry?.divisions[selectedDivisionId!]?.name ?? selectedDivisionId} districts`
    : 'Division burden overview'

  function selectShape(shape: Shape) {
    if (dragged.current) {
      dragged.current = false
      return
    }
    if (!isDrilled) onSelectDivision(shape.id)
    setActive(metrics.get(shape.id) ?? null)
  }

  function pointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.button !== 0 && event.pointerType !== 'touch') return
    const point = toSvgPoint(event.currentTarget, event.clientX, event.clientY)
    dragStart.current = { x: point.x, y: point.y, viewX: mapView.x, viewY: mapView.y, clientX: event.clientX, clientY: event.clientY }
    dragged.current = false
    setIsDragging(true)
  }

  function pointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!dragStart.current || !geometry) return
    const start = dragStart.current
    const point = toSvgPoint(event.currentTarget, event.clientX, event.clientY)
    if (Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY) > 4) dragged.current = true
    if (dragged.current) {
      setMapView((view) => clampView({ ...view, x: start.viewX + point.x - start.x, y: start.viewY + point.y - start.y }, geometry.viewBox))
    }
  }

  function pointerUp() {
    dragStart.current = null
    setIsDragging(false)
  }

  function zoomAt(nextScale: number, clientX?: number, clientY?: number) {
    if (!geometry) return
    const scale = Math.min(8, Math.max(1, nextScale))
    if (clientX == null || clientY == null || !svgRef.current) {
      const [, , width, height] = geometry.viewBox
      setMapView((view) => clampView({
        scale,
        x: width / 2 - ((width / 2 - view.x) / view.scale) * scale,
        y: height / 2 - ((height / 2 - view.y) / view.scale) * scale,
      }, geometry.viewBox))
      return
    }
    const point = toSvgPoint(svgRef.current, clientX, clientY)
    setMapView((view) => clampView({
      scale,
      x: point.x - ((point.x - view.x) / view.scale) * scale,
      y: point.y - ((point.y - view.y) / view.scale) * scale,
    }, geometry.viewBox))
  }

  function wheelZoom(event: React.WheelEvent<SVGSVGElement>) {
    event.preventDefault()
    zoomAt(mapView.scale * (event.deltaY < 0 ? 1.2 : 1 / 1.2), event.clientX, event.clientY)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">High-risk share among scored submitted health records · Drag to move, scroll or use controls to zoom.</p>
        </div>
        {isDrilled ? (
          <button type="button" className="text-sm font-medium text-primary underline-offset-4 hover:underline" onClick={onReturnToNational}>
            Bangladesh / {geometry?.divisions[selectedDivisionId!]?.name ?? selectedDivisionId} · Back to divisions
          </button>
        ) : null}
      </div>

      <div className="relative rounded-lg border bg-sky-50 p-2 sm:p-3">
        {geometry ? (
          <svg
            ref={svgRef}
            viewBox={geometry.viewBox.join(' ')}
            className={`max-h-[34rem] w-full rounded-md bg-sky-50 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            style={{ touchAction: 'none' }}
            role="group"
            aria-label={`${title}. Drag to move; use the mouse wheel or zoom controls to zoom.`}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerLeave={pointerUp}
            onPointerCancel={pointerUp}
            onWheel={wheelZoom}
          >
            <g transform={`translate(${mapView.x} ${mapView.y}) scale(${mapView.scale})`}>
              {shapes.map((shape) => {
                const metric = metrics.get(shape.id)
                const label = `${shape.name}: ${metric?.status === 'available' ? `${Math.round((metric.high_risk_share ?? 0) * 100)}% submitted-record high-risk share` : statusLabel(metric?.status)}`
                return (
                  <path
                    key={shape.id}
                    d={shape.path}
                    fill={fill(metric)}
                    stroke="white"
                    strokeWidth={isDrilled ? 1.2 : 2}
                    vectorEffect="non-scaling-stroke"
                    className="cursor-pointer transition-opacity hover:opacity-75 focus:opacity-75 focus:outline-none"
                    role={isDrilled ? 'img' : 'button'}
                    tabIndex={0}
                    aria-label={label}
                    onMouseEnter={() => setActive(metric ?? null)}
                    onFocus={() => setActive(metric ?? null)}
                    onBlur={() => setActive(null)}
                    onClick={() => selectShape(shape)}
                    onKeyDown={(event) => {
                      if (!isDrilled && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault()
                        selectShape(shape)
                      }
                    }}
                  />
                )
              })}
            </g>
          </svg>
        ) : (
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Administrative boundaries are unavailable.
          </div>
        )}

        <div className="absolute left-3 top-3 z-10 flex flex-col overflow-hidden rounded-md border bg-background/95 shadow-sm backdrop-blur" aria-label="Map zoom controls">
          <button type="button" className="grid size-9 place-items-center hover:bg-muted disabled:opacity-50" aria-label="Zoom in" title="Zoom in" disabled={mapView.scale >= 8} onClick={() => zoomAt(mapView.scale * 1.4)}><Plus className="size-4" /></button>
          <button type="button" className="grid size-9 place-items-center border-t hover:bg-muted disabled:opacity-50" aria-label="Zoom out" title="Zoom out" disabled={mapView.scale <= 1} onClick={() => zoomAt(mapView.scale / 1.4)}><Minus className="size-4" /></button>
          <button type="button" className="grid size-9 place-items-center border-t hover:bg-muted disabled:opacity-50" aria-label="Reset map view" title="Reset map view" disabled={mapView.scale === 1 && mapView.x === 0 && mapView.y === 0} onClick={() => setMapView({ scale: 1, x: 0, y: 0 })}><RotateCcw className="size-3.5" /></button>
        </div>

        {isDrilled ? <aside aria-label="District data legend" className="mt-3 max-h-64 overflow-y-auto rounded-md border bg-background/95 shadow-sm sm:max-h-72 md:absolute md:right-3 md:top-3 md:mt-0 md:w-[min(19rem,46%)] md:max-h-[calc(100%-1.5rem)] md:backdrop-blur">
          <div className="sticky top-0 border-b bg-background/95 px-3 py-2 backdrop-blur">
            <h4 className="text-sm font-semibold">District data</h4>
            <p className="text-xs text-muted-foreground">High-risk share · stored records</p>
          </div>
          <table className="w-full table-fixed text-left text-xs sm:text-sm">
            <caption className="sr-only">Districts with stored records in {geometry?.divisions[selectedDivisionId!]?.name ?? selectedDivisionId}, ranked by submitted-record high-risk share</caption>
            <colgroup><col className="w-[62%]" /><col className="w-[38%]" /></colgroup>
            <thead className="bg-muted/50 text-[10px] uppercase text-muted-foreground sm:text-xs">
              <tr><th scope="col" className="px-2 py-2">District</th><th scope="col" className="px-2 py-2">High-risk share</th></tr>
            </thead>
            <tbody>
              {[...rows].sort((a, b) => (b.high_risk_share ?? -1) - (a.high_risk_share ?? -1)).map((row) => (
                <tr key={row.id} className="border-t">
                  <th scope="row" className="break-words px-2 py-2 font-medium">{row.name}</th>
                  <td className="break-words px-2 py-2">{row.status === 'available' ? `${((row.high_risk_share ?? 0) * 100).toFixed(1)}%` : statusLabel(row.status)}</td>
                </tr>
              ))}
              {rows.length === 0 ? <tr><td colSpan={2} className="px-2 py-5 text-center text-muted-foreground">No districts in this division have stored records.</td></tr> : null}
            </tbody>
          </table>
        </aside> : null}
      </div>

      <div className="flex min-h-8 flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground" aria-live="polite">
        {active ? (
          <span>{active.name}: {active.status === 'available' ? `${(active.high_risk_share! * 100).toFixed(1)}% high-risk share` : statusLabel(active.status)}</span>
        ) : <span>{isDrilled ? 'Select a division on the map to change scope.' : 'Select a division on the map to inspect its districts.'}</span>}
        <button type="button" className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {isRefreshing ? 'Refreshing…' : 'Refresh map data'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground" aria-label="Map legend">
        <Legend color="#16a34a" label="<10%" />
        <Legend color="#ca8a04" label="10–24%" />
        <Legend color="#ea580c" label="25–39%" />
        <Legend color="#b91c1c" label="40%+" />
        <Legend color="#fbbf24" label="Awaiting risk scores" />
        <Legend color="#cbd5e1" label="Suppressed" />
        <Legend color="#e5e7eb" label="No mapped records" />
      </div>

      <p className="text-xs text-muted-foreground">{data?.metric_basis}. Regions below {data?.minimum_cell_size ?? 'the configured threshold'} scored records are suppressed. No population denominator is available; exact record counts are intentionally omitted.</p>
      <p className="text-xs text-muted-foreground">{geometry?.metadata.attribution ?? data?.attribution}</p>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm" style={{ background: color }} />{label}</span>
}

function statusLabel(status: NationalMapMetric['status'] | undefined) {
  if (status === 'suppressed') return 'Suppressed'
  if (status === 'awaiting_scores') return 'Awaiting risk scores'
  if (status === 'unavailable') return 'No mapped records'
  return 'Unavailable'
}
