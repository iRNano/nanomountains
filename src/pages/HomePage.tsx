import { Link } from 'react-router-dom'
import { mountains } from '../data/mountains'

export default function HomePage() {
  return (
    <main className="page">
      <h1>Mountains</h1>
      <p className="muted">Browse a mountain in 3D, or open it and plan your climb with your crew.</p>
      <div className="cards">
        {mountains.map((m) => (
          <Link key={m.id} to={`/mountains/${m.id}`} className="card">
            <h2>{m.name}</h2>
            <p className="muted">
              {m.province} · {m.elevation.toLocaleString()} MASL · Difficulty {m.difficulty}/9
            </p>
            <p>{m.summary}</p>
            <p className="muted">{m.trails.map((t) => t.name).join(', ')}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
