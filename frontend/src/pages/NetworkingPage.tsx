import { Link } from 'react-router-dom'
import '../styles/Placeholder.css'

export default function NetworkingPage() {
  return (
    <div className="placeholder-page">
      <Link to="/mainpage" className="placeholder-back">
        ← Back to home
      </Link>
      <h1>Networking</h1>
      <p className="placeholder-page-note">Coffee chat and networking — coming soon.</p>
    </div>
  )
}
