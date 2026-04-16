import { useEffect, useState } from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { getEvent, apiEventToStored } from '../services/LifecycleService'
import type { StoredEvent } from '../types/event'
import '../styles/EventConfirmation.css'

function formatDate(ev: StoredEvent): string {
  const d = new Date(ev.date + 'T00:00:00')
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  if (!ev.startTime) return dateStr
  const [h, m] = ev.startTime.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  let timeStr = `${h12}:${m} ${ampm}`
  if (ev.endTime) {
    const [eh, em] = ev.endTime.split(':')
    const eHour = parseInt(eh, 10)
    const eAmpm = eHour >= 12 ? 'PM' : 'AM'
    const eH12 = eHour % 12 || 12
    timeStr += ` – ${eH12}:${em} ${eAmpm}`
  }
  return `${dateStr} · ${timeStr}`
}

export default function EventConfirmationPage() {
  const location = useLocation()
  const eventId = (location.state as { eventId?: string })?.eventId
  const [event, setEvent] = useState<StoredEvent | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    ;(async () => {
      try {
        const ev = await getEvent(eventId)
        if (!cancelled) setEvent(apiEventToStored(ev))
      } catch {
        if (!cancelled) setFailed(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [eventId])

  if (!eventId) return <Navigate to="/mainpage" replace />

  if (failed) return <Navigate to="/mainpage" replace />

  if (!event) {
    return (
      <div className="conf-page">
        <main className="conf-content">
          <p className="conf-message">Loading…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="conf-page">
      <main className="conf-content">
        <div className="conf-icon" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4 12 14.01l-3-3" />
          </svg>
        </div>

        <h1 className="conf-title">Event Published Successfully</h1>

        <article className="conf-card">
          <h2 className="conf-card-name">{event.title}</h2>
          <p className="conf-card-meta">{formatDate(event)}</p>
          {event.location && <p className="conf-card-meta">{event.location}</p>}
          {event.capacity && (
            <p className="conf-card-meta">Capacity: {event.capacity}</p>
          )}
          {event.description && (
            <p className="conf-card-desc">{event.description}</p>
          )}
        </article>

        <p className="conf-message">
          You can now go to My Events to manage this event and create event tasks.
        </p>

        <div className="conf-actions">
          <Link to="/my-events" className="conf-btn conf-btn-primary">Go to My Events</Link>
          <Link to="/mainpage" className="conf-btn conf-btn-secondary">Back to Home</Link>
        </div>
      </main>
    </div>
  )
}
