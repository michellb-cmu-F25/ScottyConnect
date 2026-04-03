import { Link } from 'react-router-dom'
import './MainPage.css'

const MOCK_ACTIVE_EVENTS = [
  {
    id: '1',
    title: 'CMU-SV Carnival',
    date: 'Apr 12, 2026 · 5:00 PM',
    location: 'CMUSV',
    spots: '42 / 80',
  },
  {
    id: '2',
    title: 'ECE Happy Hour',
    date: 'Apr 18, 2026 · 2:00 PM',
    location: 'The Ameswell Hotel',
    spots: 'Open',
  }
] as const

export default function MainPage() {
  return (
    <div className="main-page">
      <header className="main-header">
        <div className="main-header-inner">
          <Link to="/" className="main-brand">
            <img
              src="/scotty_connect_square.png"
              alt=""
              className="main-brand-logo"
              width={40}
              height={40}
            />
            <span className="main-brand-text">ScottyConnect</span>
          </Link>
        </div>
      </header>

      <main className="main-content">

        <section className="main-section" aria-labelledby="events-heading">
          <div className="main-section-head">
            <h2 id="events-heading" className="main-section-title">
              Active events
            </h2>
            <p className="main-section-desc">Open registrations and upcoming sessions</p>
          </div>
          <ul className="main-event-list">
            {MOCK_ACTIVE_EVENTS.map((ev) => (
              <li key={ev.id}>
                <article className="main-event-card">
                  <div className="main-event-card-body">
                    <h3 className="main-event-title">{ev.title}</h3>
                    <p className="main-event-meta">{ev.date}</p>
                    <p className="main-event-meta">{ev.location}</p>
                  </div>
                  <div className="main-event-card-aside">
                    <span className="main-event-badge">{ev.spots}</span>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <section className="main-section" aria-labelledby="actions-heading">
          <div className="main-section-head">
            <h2 id="actions-heading" className="main-section-title">
              Quick actions
            </h2>
            <p className="main-section-desc">Shortcuts for networking, feedback, publishing, and attendance</p>
          </div>
          <ul className="main-action-grid">
            <li>
              <Link to="/publish-event" className="main-action-card">
                <span className="main-action-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </span>
                <span className="main-action-label">Publish new event</span>
                <span className="main-action-hint">Create and manage lifecycle</span>
              </Link>
            </li>
            <li>
              <Link to="/networking" className="main-action-card">
                <span className="main-action-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <span className="main-action-label">Networking</span>
                <span className="main-action-hint">Meet peers and mentors</span>
              </Link>
            </li>
            <li>
              <Link to="/feedback" className="main-action-card">
                <span className="main-action-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <span className="main-action-label">Feedback</span>
                <span className="main-action-hint">Reviews and suggestions</span>
              </Link>
            </li>
            
            <li>
              <Link to="/attendance" className="main-action-card">
                <span className="main-action-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <span className="main-action-label">Attendance</span>
                <span className="main-action-hint">Events you organized</span>
              </Link>
            </li>
          </ul>
        </section>

        <section className="main-my-events-cta" aria-label="My events">
          <Link to="/my-events" className="main-my-events-button">
            <span className="main-my-events-button-title">My Events</span>
            <span className="main-my-events-button-desc">
              Events you participate in or organize
            </span>
          </Link>
        </section>
      </main>

      <footer className="main-footer">
        <p>ScottyConnect · Carnegie Mellon University</p>
      </footer>
    </div>
  )
}
