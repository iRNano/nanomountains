import type { Mountain } from './types'

// Trail lines and POIs below are hand-placed approximations for the prototype.
// Replace them with a club GPX track (see README) before using them on a real climb.
export const mountains: Mountain[] = [
  {
    id: 'pulag',
    name: 'Mt. Pulag',
    province: 'Benguet',
    elevation: 2926,
    difficulty: 3,
    summary:
      'Highest peak in Luzon, known for its sea of clouds and grassland summit. ' +
      'Climbs require DENR registration and an orientation at the visitor center.',
    center: [120.894, 16.578],
    zoom: 13.2,
    pitch: 62,
    bearing: -20,
    approximate: true,
    trails: [
      {
        id: 'ambangeg',
        name: 'Ambangeg Trail',
        duration: '4–6 hrs to summit',
        path: [
          [120.9095, 16.5575],
          [120.9078, 16.5612],
          [120.9062, 16.5641],
          [120.9041, 16.5668],
          [120.9019, 16.5695],
          [120.9002, 16.5722],
          [120.8983, 16.5751],
          [120.8962, 16.5779],
          [120.8946, 16.5808],
          [120.8931, 16.5837],
          [120.8915, 16.5866],
          [120.8902, 16.5895],
          [120.8889, 16.5925],
          [120.8877, 16.5948],
          [120.8869, 16.5964],
        ],
        pois: [
          { id: 'dvc', name: 'DENR Visitor Center', kind: 'registration', coord: [120.9095, 16.5575], elevation: 2150, note: 'Registration and mandatory orientation.' },
          { id: 'ranger', name: 'Ranger Station (jump-off)', kind: 'jumpoff', coord: [120.9062, 16.5641], elevation: 2400, note: 'Last stop for vehicles. Hire guides here.' },
          { id: 'camp1', name: 'Camp 1', kind: 'camp', coord: [120.9002, 16.5722], elevation: 2550 },
          { id: 'water', name: 'Water source', kind: 'water', coord: [120.8962, 16.5779], elevation: 2620, note: 'Treat or boil before drinking.' },
          { id: 'camp2', name: 'Camp 2', kind: 'camp', coord: [120.8931, 16.5837], elevation: 2740, note: 'Main campsite before the summit assault.' },
          { id: 'saddle', name: 'Saddle', kind: 'viewpoint', coord: [120.8889, 16.5925], elevation: 2860 },
          { id: 'summit', name: 'Summit', kind: 'summit', coord: [120.8869, 16.5964], elevation: 2926 },
        ],
      },
    ],
  },
  {
    id: 'batulao',
    name: 'Mt. Batulao',
    province: 'Batangas',
    elevation: 811,
    difficulty: 4,
    summary:
      'Popular dayhike south of Manila with rolling ridges and a rocky summit. ' +
      'Good for training climbs and BMC practice hikes.',
    center: [120.8075, 14.046],
    zoom: 14,
    pitch: 60,
    bearing: 30,
    approximate: true,
    trails: [
      {
        id: 'new-trail',
        name: 'New Trail',
        duration: '3–4 hrs to summit',
        path: [
          [120.8148, 14.0560],
          [120.8131, 14.0538],
          [120.8112, 14.0514],
          [120.8095, 14.0490],
          [120.8076, 14.0466],
          [120.8058, 14.0443],
          [120.8041, 14.0420],
          [120.8022, 14.0397],
        ],
        pois: [
          { id: 'jumpoff', name: 'Evercrest jump-off', kind: 'jumpoff', coord: [120.8148, 14.0560], elevation: 380 },
          { id: 'reg', name: 'Registration', kind: 'registration', coord: [120.8112, 14.0514], elevation: 450 },
          { id: 'camp', name: 'Campsite', kind: 'camp', coord: [120.8058, 14.0443], elevation: 650 },
          { id: 'summit', name: 'Summit', kind: 'summit', coord: [120.8022, 14.0397], elevation: 811 },
        ],
      },
    ],
  },
]

export function getMountain(id: string | undefined): Mountain | undefined {
  return mountains.find((m) => m.id === id)
}
