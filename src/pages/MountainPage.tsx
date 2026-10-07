import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import MountainMap from '../components/MountainMap'
import { POI_ICON } from '../data/poiIcons'
import { getMountain } from '../data/mountains'
import { listPlans, newPlan, savePlan } from '../data/plans'
import { pathLengthKm } from '../lib/geo'

export default function MountainPage() {
  const { mountainId } = useParams()
  const navigate = useNavigate()
  const mountain = getMountain(mountainId)
  const [trailId, setTrailId] = useState(mountain?.trails[0].id)
  const [selectedPoiId, setSelectedPoiId] = useState<string>()

  if (!mountain) return <p className="page">Mountain not found. <Link to="/">Back</Link></p>
  const trail = mountain.trails.find((t) => t.id === trailId) ?? mountain.trails[0]
  const plans = listPlans(mountain.id)

  const startPlan = () => {
    const plan = newPlan(mountain)
    savePlan(plan)
    navigate(`/mountains/${mountain.id}/plans/${plan.id}`)
  }

  return (
    <div className="split">
      <aside className="panel">
        <Link to="/" className="muted">← All mountains</Link>
        <h1>{mountain.name}</h1>
        <p className="muted">
          {mountain.province} · {mountain.elevation.toLocaleString()} MASL · Difficulty {mountain.difficulty}/9
        </p>
        <p>{mountain.summary}</p>

        {mountain.trails.length > 1 && (
          <select value={trail.id} onChange={(e) => setTrailId(e.target.value)}>
            {mountain.trails.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}
        <h2>{trail.name}</h2>
        <p className="muted">
          ~{pathLengthKm(trail.path).toFixed(1)} km · {trail.duration}
        </p>

        <ol className="poi-list">
          {trail.pois.map((p) => (
            <li key={p.id}>
              <button
                className={p.id === selectedPoiId ? 'active' : ''}
                onClick={() => setSelectedPoiId(p.id === selectedPoiId ? undefined : p.id)}
              >
                <span>{POI_ICON[p.kind]} {p.name}</span>
                <span className="muted">{p.elevation} m</span>
              </button>
              {p.id === selectedPoiId && p.note && <p className="poi-note">{p.note}</p>}
            </li>
          ))}
        </ol>

        <div className="cta">
          <button className="primary" onClick={startPlan}>Plan your climb</button>
          {plans.length > 0 && (
            <>
              <h3>Your plans</h3>
              <ul className="plain">
                {plans.map((p) => (
                  <li key={p.id}>
                    <Link to={`/mountains/${mountain.id}/plans/${p.id}`}>{p.title}</Link>{' '}
                    <span className="muted">{p.date}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </aside>
      <MountainMap
        mountain={mountain}
        trail={trail}
        selectedPoiId={selectedPoiId}
        onSelectPoi={(p) => setSelectedPoiId(p.id)}
      />
    </div>
  )
}
