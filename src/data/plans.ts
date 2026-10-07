import type { ClimbPlan, Mountain } from './types'

const STORAGE_KEY = 'nanomountains.plans'

export const uid = () => Math.random().toString(36).slice(2, 10)

function readAll(): Record<string, ClimbPlan> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function loadPlan(id: string): ClimbPlan | undefined {
  return readAll()[id]
}

export function savePlan(plan: ClimbPlan) {
  const all = readAll()
  all[plan.id] = plan
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // storage unavailable (private mode); plan still lives in memory and the share link
  }
}

export function listPlans(mountainId: string): ClimbPlan[] {
  return Object.values(readAll()).filter((p) => p.mountainId === mountainId)
}

// Share links carry the whole plan in the URL until there is a backend.
export function encodePlan(plan: ClimbPlan): string {
  const bytes = new TextEncoder().encode(JSON.stringify(plan))
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodePlan(encoded: string): ClimbPlan | undefined {
  try {
    const bin = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return undefined
  }
}

/** A starter plan shaped like a BMC pre-climb, so the planner is never empty. */
export function newPlan(mountain: Mountain): ClimbPlan {
  const trail = mountain.trails[0]
  const poi = (kind: string) => trail.pois.find((p) => p.kind === kind)?.id
  const crew = [
    { id: uid(), name: 'Team Leader', role: 'Team Leader' as const },
    { id: uid(), name: 'Sweeper', role: 'Sweeper' as const },
    { id: uid(), name: 'Medic', role: 'Medic' as const },
    { id: uid(), name: 'Cook', role: 'Cook' as const },
  ]
  const [tl, , medic, cook] = crew
  return {
    id: uid(),
    title: `${mountain.name} climb`,
    mountainId: mountain.id,
    trailId: trail.id,
    date: new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10),
    crew,
    itinerary: [
      { id: uid(), day: 1, time: '05:00', activity: 'ETD meeting point', poiId: undefined },
      { id: uid(), day: 1, time: '10:00', activity: 'Registration', poiId: poi('registration') },
      { id: uid(), day: 1, time: '11:00', activity: 'Start trek', poiId: poi('jumpoff') },
      { id: uid(), day: 1, time: '15:00', activity: 'Set up camp', poiId: poi('camp') },
      { id: uid(), day: 2, time: '03:00', activity: 'Summit assault', poiId: poi('summit') },
    ],
    gear: [
      { id: uid(), name: 'Tent (4-person)', kind: 'group', assigneeId: tl.id, packed: false },
      { id: uid(), name: 'Stove + fuel', kind: 'group', assigneeId: cook.id, packed: false },
      { id: uid(), name: 'First aid kit', kind: 'group', assigneeId: medic.id, packed: false },
      { id: uid(), name: 'Headlamp + extra batteries', kind: 'individual', packed: false },
      { id: uid(), name: 'Rain gear', kind: 'individual', packed: false },
      { id: uid(), name: '2L water', kind: 'individual', packed: false },
    ],
    meals: [
      { id: uid(), day: 1, slot: 'Lunch', menu: 'Packed lunch', poiId: poi('jumpoff') },
      { id: uid(), day: 1, slot: 'Dinner', menu: 'Sinigang + rice', cookId: cook.id, poiId: poi('camp') },
      { id: uid(), day: 2, slot: 'Breakfast', menu: 'Champorado + tuyo', cookId: cook.id, poiId: poi('camp') },
    ],
  }
}
