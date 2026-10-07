import { useEffect, useRef, useState } from 'react'
import { Map as MLMap, Marker, NavigationControl, ScaleControl, setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Mountain, Poi, Trail } from '../data/types'
import { POI_ICON } from '../data/poiIcons'

// The bundler can't see MapLibre's worker file, so point MapLibre at the copy Vite emits.
setWorkerUrl(workerUrl)

// Free, keyless elevation tiles (Mapzen/Tilezen on AWS Open Data, Terrarium encoding).
const DEM_TILES = ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png']

const BASEMAPS = {
  terrain: { label: 'Terrain', tiles: null },
  topo: {
    label: 'Topo',
    tiles: ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
    attribution: '© OpenTopoMap (CC-BY-SA), © OpenStreetMap contributors',
  },
  satellite: {
    label: 'Satellite',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    attribution: 'Imagery © Esri',
  },
} as const
type BasemapId = keyof typeof BASEMAPS

export interface MapStop {
  poiId: string
  /** short badge text, e.g. "1" or "D1 05:00" */
  badge: string
}

interface Props {
  mountain: Mountain
  trail: Trail
  selectedPoiId?: string
  onSelectPoi?: (poi: Poi) => void
  /** plan overlay: numbered itinerary stops pinned to POIs */
  stops?: MapStop[]
}

function buildStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      dem: { type: 'raster-dem', tiles: DEM_TILES, encoding: 'terrarium', tileSize: 256, maxzoom: 15 },
      hillshadeDem: { type: 'raster-dem', tiles: DEM_TILES, encoding: 'terrarium', tileSize: 256, maxzoom: 15 },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#dfe6d5' } },
      {
        id: 'relief',
        type: 'color-relief',
        source: 'hillshadeDem',
        paint: {
          'color-relief-color': [
            'interpolate', ['linear'], ['elevation'],
            0, '#9cc5a1',
            500, '#b7d39b',
            1200, '#d8d49a',
            2000, '#c9ad85',
            2600, '#b89a83',
            3000, '#efe9e2',
          ],
        },
      },
      {
        id: 'hillshade',
        type: 'hillshade',
        source: 'hillshadeDem',
        paint: { 'hillshade-exaggeration': 0.6, 'hillshade-shadow-color': '#3d4a3a' },
      },
    ],
    terrain: { source: 'dem', exaggeration: 1.4 },
    sky: {
      'sky-color': '#9ec9ef',
      'horizon-color': '#e8f1f8',
      'fog-color': '#ffffff',
      'sky-horizon-blend': 0.6,
      'horizon-fog-blend': 0.6,
      'fog-ground-blend': 0.8,
    },
  }
}

export default function MountainMap({ mountain, trail, selectedPoiId, onSelectPoi, stops }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const onSelectRef = useRef(onSelectPoi)
  const [ready, setReady] = useState(false)
  const [basemap, setBasemap] = useState<BasemapId>('terrain')

  useEffect(() => {
    onSelectRef.current = onSelectPoi
  }, [onSelectPoi])

  // One map per mountain + trail; overlays below update in place.
  useEffect(() => {
    if (!container.current) return
    const map = new MLMap({
      container: container.current,
      style: buildStyle(),
      center: mountain.center,
      zoom: mountain.zoom,
      pitch: mountain.pitch,
      bearing: mountain.bearing,
      maxPitch: 80,
      attributionControl: { compact: true, customAttribution: 'Elevation: Mapzen Terrain Tiles (AWS Open Data)' },
    })
    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right')
    map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left')
    map.on('load', () => {
      map.addSource('trail', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: trail.path } },
      })
      map.addLayer({
        id: 'trail-casing',
        type: 'line',
        source: 'trail',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.9 },
      })
      map.addLayer({
        id: 'trail-line',
        type: 'line',
        source: 'trail',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#d9480f', 'line-width': 4, 'line-dasharray': [2, 1] },
      })
      setReady(true)
    })
    mapRef.current = map
    return () => {
      setReady(false)
      map.remove()
      mapRef.current = null
    }
  }, [mountain, trail])

  // Basemap switcher: raster layer slotted under the hillshade.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (map.getLayer('basemap')) map.removeLayer('basemap')
    if (map.getSource('basemap')) map.removeSource('basemap')
    const def = BASEMAPS[basemap]
    if (def.tiles) {
      map.addSource('basemap', { type: 'raster', tiles: [...def.tiles], tileSize: 256, maxzoom: 17, attribution: def.attribution })
      map.addLayer({ id: 'basemap', type: 'raster', source: 'basemap' }, 'hillshade')
    }
    map.setLayoutProperty('relief', 'visibility', def.tiles ? 'none' : 'visible')
  }, [basemap, ready])

  // POI markers, with itinerary badges when a plan is shown.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = trail.pois.map((poi) => {
      const el = document.createElement('button')
      el.className = 'poi-marker' + (poi.id === selectedPoiId ? ' selected' : '')
      el.title = `${poi.name} · ${poi.elevation} m`
      const badges = (stops ?? []).filter((s) => s.poiId === poi.id).map((s) => s.badge)
      el.innerHTML =
        `<span class="poi-icon">${POI_ICON[poi.kind]}</span>` +
        `<span class="poi-label">${poi.name}</span>` +
        badges.map((b) => `<span class="poi-badge">${b}</span>`).join('')
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onSelectRef.current?.(poi)
      })
      return new Marker({ element: el, anchor: 'bottom' }).setLngLat(poi.coord).addTo(map)
    })
  }, [trail, stops, selectedPoiId, ready])

  // Fly to the selected POI; fly back to the overview when cleared.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const poi = trail.pois.find((p) => p.id === selectedPoiId)
    if (poi) {
      map.flyTo({ center: poi.coord, zoom: 15.2, pitch: 68, bearing: map.getBearing(), duration: 1800, essential: true })
    } else {
      map.flyTo({ center: mountain.center, zoom: mountain.zoom, pitch: mountain.pitch, bearing: mountain.bearing, duration: 1500 })
    }
  }, [selectedPoiId, ready, trail, mountain])

  return (
    <div className="map-wrap">
      <div ref={container} className="map" />
      <div className="basemap-switch" role="group" aria-label="Basemap">
        {(Object.keys(BASEMAPS) as BasemapId[]).map((id) => (
          <button key={id} className={id === basemap ? 'active' : ''} onClick={() => setBasemap(id)}>
            {BASEMAPS[id].label}
          </button>
        ))}
      </div>
      {mountain.approximate && (
        <div className="map-note">Trail and POIs are approximate placeholders until a club GPX is loaded.</div>
      )}
    </div>
  )
}
