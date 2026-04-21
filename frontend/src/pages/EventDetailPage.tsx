import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StorageUtil from '../common/StorageUtil'
import { apiUrl } from '../services/Config'
import { getEvent, apiEventToStored } from '../services/LifecycleService'
import {
  getRegistrationStatus,
  registerEvent,
  unregisterEvent,
  getRegisteredUsers,
} from '../services/AttendanceService'
import type { StoredEvent } from '../types/event'
import '../styles/EventDetail.css'

// Labels for the event status
const STATUS_LABELS: Record<StoredEvent['status'], string> = {
  draft: 'Draft',
  published: 'Published',
  ended: 'Ended',
  cancelled: 'Cancelled',
}

// Format the date and time of the event
function formatDateTime(ev: StoredEvent): string {
  const d = new Date(ev.date + 'T00:00:00')
  const dateLabel = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  if (!ev.startTime) return dateLabel

  const [startH, startM] = ev.startTime.split(':')
  const startHour = parseInt(startH, 10)
  const startAmpm = startHour >= 12 ? 'PM' : 'AM'
  const start12 = startHour % 12 || 12
  let timeLabel = `${start12}:${startM} ${startAmpm}`

  if (ev.endTime) {
    const [endH, endM] = ev.endTime.split(':')
    const endHour = parseInt(endH, 10)
    const endAmpm = endHour >= 12 ? 'PM' : 'AM'
    const end12 = endHour % 12 || 12
    timeLabel += ` - ${end12}:${endM} ${endAmpm}`
  }

  return `${dateLabel} · ${timeLabel}`
}

// Format the capacity of the event
function formatCapacity(ev: StoredEvent): string {
  if (ev.status != "published") return 'Closed'
  if (ev.capacity == null) return 'Open registration'
  if (ev.registeredCount == null) return 'Open registration'
  return `${ev.capacity - ev.registeredCount} / ${ev.capacity} spots remaining`
}

export default function EventDetailPage() {
  // Get the event ID from the URL
  const { id } = useParams<{ id: string }>()
  
  // State variables
  const [event, setEvent] = useState<StoredEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [registrationLoading, setRegistrationLoading] = useState(true)
  const [registrationError, setRegistrationError] = useState('')
  const [registrationSaving, setRegistrationSaving] = useState(false)
  const [registerSuccessMessage, setRegisterSuccessMessage] = useState('')
  const [hostLabel, setHostLabel] = useState('')

  // Load event details on mount
  useEffect(() => {
    if (!id) return

    let cancelled = false
    ;(async () => {
      try {
        const ev = await getEvent(id)
        const registeredUsers = await getRegisteredUsers(id)
        ev.registeredCount = registeredUsers.length
        if (!cancelled) {
          setEvent(apiEventToStored(ev))
          setLoadError('')
        }
      } catch (e) {
        if (!cancelled) {
          setEvent(null)
          setLoadError(e instanceof Error ? e.message : 'Failed to load event details')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  // Load registration status on mount
  useEffect(() => {
    if (!id) return

    let cancelled = false
    ;(async () => {
      try {
        const registered = await getRegistrationStatus(id)
        if (!cancelled) {
          setIsRegistered(registered)
          setRegistrationError('')
        }
      } catch (e) {
        if (!cancelled) {
          setRegistrationError(e instanceof Error ? e.message : 'Failed to load registration status')
        }
      } finally {
        if (!cancelled) setRegistrationLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  // Resolve host display name (username when available via discover cache or API)
  useEffect(() => {
    if (!event) {
      setHostLabel('')
      return
    }

    const me = StorageUtil.getUser()
    if (me?.id === event.ownerId) {
      setHostLabel(me.username ? me.username : 'You')
      return
    }

    setHostLabel('')
    let cancelled = false
    ;(async () => {
      try {
        const raw = sessionStorage.getItem('scotty_networking_discover')
        if (raw) {
          const users = JSON.parse(raw) as { id?: string; username?: string }[]
          const hit = users.find((u) => u.id === event.ownerId)
          if (hit?.username) {
            if (!cancelled) setHostLabel(hit.username)
            return
          }
        }
      } catch {
        /* ignore cache parse errors */
      }

      try {
        const res = await fetch(apiUrl('/api/accounts/discover'))
        const data = (await res.json()) as { users?: { id: string; username: string }[] }
        const hit = data.users?.find((u) => u.id === event.ownerId)
        if (!cancelled) {
          setHostLabel(hit?.username ? hit.username : 'Organizer')
        }
      } catch {
        if (!cancelled) setHostLabel('Organizer')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [event])

  // Handles the registration click event
  async function handleRegistrationClick() {
    if (!id || registrationSaving) return

    setRegistrationSaving(true)
    setRegistrationError('')
    try {
      if (isRegistered) {
        const registered = await unregisterEvent(id)
        setIsRegistered(registered)
        setRegisterSuccessMessage('Successfully unregistered from the event.')
      } else {
        const registered = await registerEvent(id)
        setIsRegistered(registered)
        setRegisterSuccessMessage('Successfully registered for the event.')
      }
    } catch (e) {
      setRegistrationError(e instanceof Error ? e.message : 'Failed to update registration')
    } finally {
      setRegistrationSaving(false)
    }
  }

  // Determine if the event is published
  const isPublished = event?.status === 'published'

  // Determine if the registration button is disabled
  const isRegistrationButtonDisabled =
    !isPublished || registrationLoading || registrationSaving || loading || !!loadError

  // Determine the label for the registration button
  const registrationButtonLabel = isPublished
    ? isRegistered
      ? 'Cancel RSVP'
      : 'RSVP'
    : 'RSVP Unavailable'

  // Render the event detail page
  return (
    <div className="event-detail-page">
      <header className="event-detail-header">
        <div className="event-detail-header-inner">
          <Link to="/mainpage" className="event-detail-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
        </div>
      </header>

      <main className="event-detail-content">
        {loading && <p className="event-detail-muted">Loading event details...</p>}

        {!loading && loadError && (
          <div className="event-detail-alert" role="alert">
            <p>{loadError}</p>
            <Link to="/mainpage" className="event-detail-link">
              Return to home
            </Link>
          </div>
        )}

        {!loading && !loadError && event && (
          <article className="event-detail-card">
            <div className="event-detail-top">
              <h1 className="event-detail-title">{event.title}</h1>
              <span className={`event-detail-status event-detail-status-${event.status}`}>
                {STATUS_LABELS[event.status]}
              </span>
            </div>

            <div className="event-detail-actions">
              <button
                type="button"
                className={`event-detail-register-btn ${
                  isRegistered && isPublished ? 'unregister' : ''
                }`}
                disabled={isRegistrationButtonDisabled}
                onClick={handleRegistrationClick}
              >
                {registrationSaving ? 'Saving...' : registrationButtonLabel}
              </button>
            </div>

            {registerSuccessMessage && <div className="event-detail-success-message">{registerSuccessMessage}</div>}
            {registrationError && <p className="event-detail-inline-error">{registrationError}</p>}

            <p className="event-detail-description">{event.description}</p>

            <dl className="event-detail-grid">
              <div className="event-detail-item">
                <dt>Hosted by</dt>
                <dd>{hostLabel || '—'}</dd>
              </div>
              <div className="event-detail-item">
                <dt>Date and time</dt>
                <dd>{formatDateTime(event)}</dd>
              </div>
              <div className="event-detail-item">
                <dt>Location</dt>
                <dd>{event.location || 'TBA'}</dd>
              </div>
              <div className="event-detail-item">
                <dt>Registration Status</dt>
                <dd>{formatCapacity(event)}</dd>
              </div>
            </dl>
          </article>
        )}
      </main>

      <footer className="event-detail-footer">
        <p>ScottyConnect · Carnegie Mellon University</p>
      </footer>
    </div>
  )
}
