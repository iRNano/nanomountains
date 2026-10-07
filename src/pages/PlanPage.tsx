import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import MountainMap, { type MapStop } from '../components/MountainMap'
import { POI_ICON } from '../data/poiIcons'
import { getMountain } from '../data/mountains'
import { decodePlan, encodePlan, loadPlan, savePlan, uid } from '../data/plans'
import type { ClimbPlan, CrewRole, Meal, Trail } from '../data/types'

const TABS = ['Itinerary', 'Crew', 'Gear', 'Meals'] as const
type Tab = (typeof TABS)[number]
const ROLES: CrewRole[] = ['Team Leader', 'Sweeper', 'Navigator', 'Medic', 'Cook', 'Member']
const MEAL_SLOTS: Meal['slot'][] = ['Breakfast', 'Lunch', 'Dinner', 'Trail food']

export default function PlanPage() {
  const { mountainId, planId } = useParams()
  const [search] = useSearchParams()
  const mountain = getMountain(mountainId)

  const [plan, setPlan] = useState<ClimbPlan | undefined>(() => {
    const shared = search.get('p')
    return (shared && decodePlan(shared)) || (planId ? loadPlan(planId) : undefined)
  })
  const [tab, setTab] = useState<Tab>('Itinerary')
  const [selectedPoiId, setSelectedPoiId] = useState<string>()
  const [playing, setPlaying] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (plan) savePlan(plan)
  }, [plan])

  const trail = mountain?.trails.find((t) => t.id === plan?.trailId) ?? mountain?.trails[0]
  const itinerary = useMemo(
    () => [...(plan?.itinerary ?? [])].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)),
    [plan?.itinerary],
  )
  const stops: MapStop[] = useMemo(
    () => itinerary.filter((i) => i.poiId).map((i) => ({ poiId: i.poiId!, badge: `D${i.day} ${i.time}` })),
    [itinerary],
  )

  const togglePlay = () => {
    if (playing) {
      setPlaying(false)
      setSelectedPoiId(undefined)
    } else if (stops.length > 0) {
      setSelectedPoiId(stops[0].poiId)
      setPlaying(true)
    }
  }

  // "Fly the itinerary": step through each stop on the 3D map.
  useEffect(() => {
    if (!playing) return
    const route = stops.map((s) => s.poiId)
    let i = 0
    const timer = setInterval(() => {
      i++
      if (i >= route.length) {
        setPlaying(false)
        setSelectedPoiId(undefined)
      } else setSelectedPoiId(route[i])
    }, 3200)
    return () => clearInterval(timer)
  }, [playing, stops])

  if (!mountain || !trail) return <p className="page">Mountain not found. <Link to="/">Back</Link></p>
  if (!plan) {
    return (
      <p className="page">
        This plan isn't saved on this device. Ask your team leader for the share link, or{' '}
        <Link to={`/mountains/${mountain.id}`}>start a new plan</Link>.
      </p>
    )
  }

  const update = (patch: Partial<ClimbPlan>) => setPlan({ ...plan, ...patch })
  const crewName = (id?: string) => plan.crew.find((c) => c.id === id)?.name ?? 'Unassigned'

  const copyShareLink = async () => {
    const url = `${location.origin}/mountains/${mountain.id}/plans/${plan.id}?p=${encodePlan(plan)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      prompt('Copy this link', url)
    }
  }

  return (
    <div className="split">
      <aside className="panel plan-panel">
        <Link to={`/mountains/${mountain.id}`} className="muted">← {mountain.name}</Link>
        <input className="title-input" value={plan.title} onChange={(e) => update({ title: e.target.value })} />
        <div className="row">
          <label>
            Climb date <input type="date" value={plan.date} onChange={(e) => update({ date: e.target.value })} />
          </label>
          <span className="muted">{trail.name}</span>
        </div>
        <div className="row actions">
          <button onClick={togglePlay} disabled={stops.length === 0}>
            {playing ? '■ Stop' : '▶ Fly the itinerary'}
          </button>
          <button onClick={copyShareLink}>{copied ? 'Link copied' : 'Copy share link'}</button>
          <button onClick={() => window.print()}>Print</button>
        </div>

        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </nav>

        {tab === 'Itinerary' && (
          <section>
            <table className="grid">
              <thead>
                <tr><th>Day</th><th>Time</th><th>Activity</th><th>Where</th><th /></tr>
              </thead>
              <tbody>
                {itinerary.map((item) => {
                  const set = (patch: Partial<typeof item>) =>
                    update({ itinerary: plan.itinerary.map((i) => (i.id === item.id ? { ...i, ...patch } : i)) })
                  return (
                    <tr key={item.id} className={item.poiId && item.poiId === selectedPoiId ? 'hl' : ''}>
                      <td><input type="number" min={1} value={item.day} onChange={(e) => set({ day: +e.target.value || 1 })} /></td>
                      <td><input type="time" value={item.time} onChange={(e) => set({ time: e.target.value })} /></td>
                      <td><input value={item.activity} onChange={(e) => set({ activity: e.target.value })} /></td>
                      <td>
                        <PoiSelect trail={trail} value={item.poiId} onChange={(poiId) => set({ poiId })} onFocusPoi={setSelectedPoiId} />
                      </td>
                      <td>
                        <button className="icon" title="Remove" onClick={() => update({ itinerary: plan.itinerary.filter((i) => i.id !== item.id) })}>×</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <button
              onClick={() => {
                const last = itinerary[itinerary.length - 1]
                update({ itinerary: [...plan.itinerary, { id: uid(), day: last?.day ?? 1, time: '12:00', activity: '' }] })
              }}
            >
              + Add stop
            </button>
          </section>
        )}

        {tab === 'Crew' && (
          <section>
            <ul className="plain">
              {plan.crew.map((c) => {
                const set = (patch: Partial<typeof c>) =>
                  update({ crew: plan.crew.map((x) => (x.id === c.id ? { ...x, ...patch } : x)) })
                return (
                  <li key={c.id} className="row">
                    <input value={c.name} onChange={(e) => set({ name: e.target.value })} />
                    <select value={c.role} onChange={(e) => set({ role: e.target.value as CrewRole })}>
                      {ROLES.map((r) => <option key={r}>{r}</option>)}
                    </select>
                    <button className="icon" title="Remove" onClick={() => update({ crew: plan.crew.filter((x) => x.id !== c.id) })}>×</button>
                  </li>
                )
              })}
            </ul>
            <button onClick={() => update({ crew: [...plan.crew, { id: uid(), name: 'New member', role: 'Member' }] })}>
              + Add member
            </button>
          </section>
        )}

        {tab === 'Gear' && (
          <section>
            {(['group', 'individual'] as const).map((kind) => (
              <div key={kind}>
                <h3>{kind === 'group' ? 'Group gear' : 'Individual gear (everyone brings)'}</h3>
                <ul className="plain">
                  {plan.gear.filter((g) => g.kind === kind).map((g) => {
                    const set = (patch: Partial<typeof g>) =>
                      update({ gear: plan.gear.map((x) => (x.id === g.id ? { ...x, ...patch } : x)) })
                    return (
                      <li key={g.id} className="row">
                        <input type="checkbox" checked={g.packed} onChange={(e) => set({ packed: e.target.checked })} title="Packed" />
                        <input value={g.name} onChange={(e) => set({ name: e.target.value })} />
                        {kind === 'group' && (
                          <select value={g.assigneeId ?? ''} onChange={(e) => set({ assigneeId: e.target.value || undefined })}>
                            <option value="">Unassigned</option>
                            {plan.crew.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        )}
                        <button className="icon" title="Remove" onClick={() => update({ gear: plan.gear.filter((x) => x.id !== g.id) })}>×</button>
                      </li>
                    )
                  })}
                </ul>
                <button onClick={() => update({ gear: [...plan.gear, { id: uid(), name: '', kind, packed: false }] })}>
                  + Add {kind} gear
                </button>
              </div>
            ))}
          </section>
        )}

        {tab === 'Meals' && (
          <section>
            <table className="grid">
              <thead>
                <tr><th>Day</th><th>Meal</th><th>Menu</th><th>Cook</th><th>Where</th><th /></tr>
              </thead>
              <tbody>
                {[...plan.meals].sort((a, b) => a.day - b.day || MEAL_SLOTS.indexOf(a.slot) - MEAL_SLOTS.indexOf(b.slot)).map((m) => {
                  const set = (patch: Partial<Meal>) =>
                    update({ meals: plan.meals.map((x) => (x.id === m.id ? { ...x, ...patch } : x)) })
                  return (
                    <tr key={m.id}>
                      <td><input type="number" min={1} value={m.day} onChange={(e) => set({ day: +e.target.value || 1 })} /></td>
                      <td>
                        <select value={m.slot} onChange={(e) => set({ slot: e.target.value as Meal['slot'] })}>
                          {MEAL_SLOTS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td><input value={m.menu} onChange={(e) => set({ menu: e.target.value })} /></td>
                      <td>
                        <select value={m.cookId ?? ''} onChange={(e) => set({ cookId: e.target.value || undefined })} title={crewName(m.cookId)}>
                          <option value="">—</option>
                          {plan.crew.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td><PoiSelect trail={trail} value={m.poiId} onChange={(poiId) => set({ poiId })} onFocusPoi={setSelectedPoiId} /></td>
                      <td><button className="icon" title="Remove" onClick={() => update({ meals: plan.meals.filter((x) => x.id !== m.id) })}>×</button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <button onClick={() => update({ meals: [...plan.meals, { id: uid(), day: 1, slot: 'Dinner', menu: '' }] })}>+ Add meal</button>
          </section>
        )}
      </aside>
      <MountainMap
        mountain={mountain}
        trail={trail}
        stops={stops}
        selectedPoiId={selectedPoiId}
        onSelectPoi={(p) => setSelectedPoiId(p.id)}
      />
    </div>
  )
}

function PoiSelect({
  trail,
  value,
  onChange,
  onFocusPoi,
}: {
  trail: Trail
  value?: string
  onChange: (poiId?: string) => void
  onFocusPoi: (poiId?: string) => void
}) {
  return (
    <div className="poi-select">
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
        <option value="">Off-trail</option>
        {trail.pois.map((p) => (
          <option key={p.id} value={p.id}>{POI_ICON[p.kind]} {p.name}</option>
        ))}
      </select>
      {value && (
        <button className="icon" title="Show on map" onClick={() => onFocusPoi(value)}>📍</button>
      )}
    </div>
  )
}
