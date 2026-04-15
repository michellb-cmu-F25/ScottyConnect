import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import StorageUtil, { type RecommendationStrategy } from '../common/StorageUtil'
import { listPublishedEvents, listMyEvents, apiEventToStored } from '../services/eventApi'
import { getRecommendations } from '../services/recommendationApi'
import type { StoredEvent } from '../types/event'
import '../styles/Main.css'

const STRATEGY_OPTIONS: { value: RecommendationStrategy; label: string }[] = [
  { value: 'tag', label: 'Tag match' },
  { value: 'popularity', label: 'Popular' },
  { value: 'hybrid', label: 'For you' },
]

/** Convert HH:mm (24h) to h:mm AM/PM */
function formatTime12h(hhmm: string): string {
  const parts = hhmm.split(':')
  if (parts.length < 2) return hhmm
  const hour = parseInt(parts[0], 10)
  const min = parts[1]
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${min} ${ampm}`
}

function formatEventDate(ev: StoredEvent): string {
  const d = new Date(ev.date + 'T00:00:00')
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (ev.startTime) {
    const startLabel = formatTime12h(ev.startTime)
    if (ev.endTime) {
      return `${dateStr} · ${startLabel} – ${formatTime12h(ev.endTime)}`
    }
    return `${dateStr} · ${startLabel}`
  }
  return dateStr
}

function formatSpots(ev: StoredEvent): string {
  if (ev.capacity) return `0 / ${ev.capacity}`
  return 'Open'
}

export default function MainPage() {
  const userId = StorageUtil.getUser().id
  const isLoggedIn = !!userId && !!StorageUtil.getToken()

  const [events, setEvents] = useState<StoredEvent[]>([])
  const [loadError, setLoadError] = useState('')
  const [myCreatedCount, setMyCreatedCount] = useState<number | null>(null)
  const [strategy, setStrategy] = useState<RecommendationStrategy>(() =>
    StorageUtil.getStrategy(),
  )

  function handleStrategyChange(next: RecommendationStrategy) {
    setStrategy(next)
    StorageUtil.setStrategy(next)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (isLoggedIn && userId) {
          const list = await getRecommendations(userId, strategy, 20)
          if (!cancelled) {
            setEvents(list.map(apiEventToStored))
            setLoadError('')
          }
        } else {
          const list = await listPublishedEvents()
          if (!cancelled) {
            setEvents(list.map(apiEventToStored))
            setLoadError('')
          }
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load events')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isLoggedIn, userId, strategy])

  useEffect(() => {
    if (!StorageUtil.getToken()) {
      setMyCreatedCount(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const mine = await listMyEvents()
        if (!cancelled) setMyCreatedCount(mine.length)
      } catch {
        if (!cancelled) setMyCreatedCount(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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
          <Link to="/my-events" className="main-nav-link">
            My Events{myCreatedCount != null && myCreatedCount > 0 && ` (${myCreatedCount})`}
          </Link>
        </div>
      </header>

      <main className="main-content">

        <section className="main-section" aria-labelledby="events-heading">
          <div className="main-section-head">
            <h2 id="events-heading" className="main-section-title">
              {isLoggedIn ? 'Recommended for you' : 'Active events'}
            </h2>
            <p className="main-section-desc">
              {isLoggedIn
                ? 'Published events ranked by your selected strategy'
                : 'Open registrations and upcoming sessions'}
            </p>
            {isLoggedIn && (
              <div
                className="main-strategy-selector"
                role="radiogroup"
                aria-label="Recommendation strategy"
              >
                {STRATEGY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={strategy === opt.value}
                    className={`main-strategy-option${
                      strategy === opt.value ? ' is-active' : ''
                    }`}
                    onClick={() => handleStrategyChange(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {loadError && <p className="main-section-desc" role="alert">{loadError}</p>}
          <ul className="main-event-list">
            {events.map((ev) => (
              <li key={ev.id}>
                <article className="main-event-card">
                  <div className="main-event-card-body">
                    <h3 className="main-event-title">{ev.title}</h3>
                    <p className="main-event-meta">{formatEventDate(ev)}</p>
                    {ev.location && <p className="main-event-meta">{ev.location}</p>}
                  </div>
                  <div className="main-event-card-aside">
                    <span className="main-event-badge">{formatSpots(ev)}</span>
                  </div>
                </article>
              </li>
            ))}
          </ul>
          {events.length === 0 && !loadError && (
            <p className="main-section-desc">No published events yet.</p>
          )}
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

      </main>

      <footer className="main-footer">
        <p>ScottyConnect · Carnegie Mellon University</p>
      </footer>
    </div>
  )
}
