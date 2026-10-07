export type LngLat = [number, number]

export type PoiKind =
  | 'jumpoff'
  | 'registration'
  | 'trailhead'
  | 'camp'
  | 'water'
  | 'viewpoint'
  | 'summit'

export interface Poi {
  id: string
  name: string
  kind: PoiKind
  coord: LngLat
  /** meters above sea level */
  elevation: number
  note?: string
}

export interface Trail {
  id: string
  name: string
  /** ordered from jump-off to summit */
  path: LngLat[]
  pois: Poi[]
  /** typical one-way hiking time, e.g. "4–6 hrs to summit" */
  duration: string
}

export interface Mountain {
  id: string
  name: string
  province: string
  elevation: number
  /** PinoyMountaineer-style 1–9 scale */
  difficulty: number
  summary: string
  center: LngLat
  zoom: number
  pitch: number
  bearing: number
  trails: Trail[]
  /** true while trail/POI coordinates are hand-placed approximations */
  approximate: boolean
}

export type CrewRole =
  | 'Team Leader'
  | 'Sweeper'
  | 'Navigator'
  | 'Medic'
  | 'Cook'
  | 'Member'

export interface CrewMember {
  id: string
  name: string
  role: CrewRole
}

export interface ItineraryItem {
  id: string
  day: number
  time: string
  activity: string
  /** where this happens on the mountain, if anywhere */
  poiId?: string
}

export interface GearItem {
  id: string
  name: string
  kind: 'group' | 'individual'
  /** crew member id responsible for group gear */
  assigneeId?: string
  packed: boolean
}

export interface Meal {
  id: string
  day: number
  slot: 'Breakfast' | 'Lunch' | 'Dinner' | 'Trail food'
  menu: string
  cookId?: string
  poiId?: string
}

export interface ClimbPlan {
  id: string
  title: string
  mountainId: string
  trailId: string
  date: string
  crew: CrewMember[]
  itinerary: ItineraryItem[]
  gear: GearItem[]
  meals: Meal[]
}
