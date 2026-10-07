import type { LngLat } from '../data/types'

function haversineKm([lng1, lat1]: LngLat, [lng2, lat2]: LngLat): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

export function pathLengthKm(path: LngLat[]): number {
  let km = 0
  for (let i = 1; i < path.length; i++) km += haversineKm(path[i - 1], path[i])
  return km
}
