import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadEvents, deleteEvent, EVENTS_STORAGE_KEY, type StoredEvent } from './CreateEventPage'
import StorageUtil from '../common/StorageUtil'
import '../styles/MyEvents.css'

type Tab = 'created' | 'registered'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Draft',     className: 'me-status-draft' },
  published: { label: 'Published', className: 'me-status-published' },
  ended:     { label: 'Ended',     className: 'me-status-ended' },
  cancelled: { label: 'Cancelled', className: 'me-status-cancelled' },
}

const FALLBACK_STATUS = { label: 'Unknown', className: 'me-status-draft' }

interface Registration {
  eventId: string
  userId: string
  registeredAt: string
}

const REGISTRATIONS_KEY = 'scottyConnectRegistrations'

function loadRegistrations(): Registration[] {
  try {
    return JSON.parse(localStorage.getItem(REGISTRATIONS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveRegistrations(regs: Registration[]) {
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(regs))
}

const MOCK_REGISTERED_EVENTS: StoredEvent[] = [
  {
    id: 'mock-reg-1',
    title: 'CMU-SV Carnival',
    description: 'Annual spring carnival at CMU Silicon Valley campus.',
    date: '2026-04-12',
    startTime: '17:00',
    endTime: '21:00',
    location: 'CMUSV',
    capacity: 80,
    status: 'published',
    ownerId: 'other-user',
    createdAt: '2026-03-20T10:00:00Z',
  },
  {
    id: 'mock-reg-2',
    title: 'ECE Happy Hour',
    description: 'Casual social gathering for ECE students and faculty.',
    date: '2026-04-18',
    startTime: '14:00',
    endTime: '16:00',
    location: 'The Ameswell Hotel',
    capacity: null,
    status: 'published',
    ownerId: 'other-user',
    createdAt: '2026-03-25T08:00:00Z',
  },
]

function formatDate(ev: StoredEvent): string {
  const d = new Date(ev.date + 'T00:00:00')
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (ev.startTime) {
    const [h, m] = ev.startTime.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return `${dateStr} · ${h12}:${m} ${ampm}`
  }
  return dateStr
}

function getActions(ev: StoredEvent): { label: string; className: string; action: string }[] {
  switch (ev.status) {
    case 'draft':
      return [
        { label: 'Tasks', className: 'me-action-publish', action: 'tasks' },
        { label: 'Edit', className: 'me-action-secondary', action: 'edit' },
        { label: 'Delete', className: 'me-action-danger', action: 'delete' },
      ]
    case 'published':
      return [
        { label: 'Tasks', className: 'me-action-publish', action: 'tasks' },
        { label: 'End Event', className: 'me-action-secondary', action: 'end' },
        { label: 'Cancel', className: 'me-action-danger', action: 'cancel' },
      ]
    case 'ended':
    case 'cancelled':
      return [
        { label: 'Tasks', className: 'me-action-secondary', action: 'tasks' },
      ]
    default:
      return []
  }
}

function transitionEvent(eventId: string, newStatus: StoredEvent['status']) {
  const events = loadEvents()
  const idx = events.findIndex((e) => e.id === eventId)
  if (idx === -1) return
  events[idx].status = newStatus
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
}

export default function MyEventsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('created')
  const [, setTick] = useState(0)
  const rerender = () => setTick((t) => t + 1)
  const [deleteTarget, setDeleteTarget] = useState<StoredEvent | null>(null)

  const user = StorageUtil.getUser()
  const createdEvents = loadEvents()
  const registrations = loadRegistrations()
  const userRegIds = new Set(registrations.filter((r) => r.userId === (user.id ?? 'anonymous')).map((r) => r.eventId))
  const registeredEvents = MOCK_REGISTERED_EVENTS.filter(() => true)
    .concat(loadEvents().filter((e) => userRegIds.has(e.id) && e.ownerId !== (user.id ?? 'anonymous')))

  function handleAction(ev: StoredEvent, action: string) {
    if (action === 'tasks') {
      navigate(`/events/${ev.id}/tasks`)
      return
    }
    if (action === 'edit') {
      navigate(`/events/${ev.id}/edit`)
      return
    }
    if (action === 'delete') {
      setDeleteTarget(ev)
      return
    }
    if (action === 'end') transitionEvent(ev.id, 'ended')
    else if (action === 'cancel') transitionEvent(ev.id, 'cancelled')
    else if (action === 'unregister') {
      const updated = loadRegistrations().filter((r) => !(r.eventId === ev.id && r.userId === (user.id ?? 'anonymous')))
      saveRegistrations(updated)
    }
    rerender()
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteEvent(deleteTarget.id)
    setDeleteTarget(null)
    rerender()
  }

  return (
    <div className="me-page">
      <header className="me-header">
        <div className="me-header-inner">
          <Link to="/mainpage" className="me-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>
        </div>
      </header>

      <main className="me-content">
        <h1 className="me-title">My Events</h1>
        <p className="me-subtitle">Events you've created or registered for.</p>

        <div className="me-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'created'}
            className={`me-tab ${tab === 'created' ? 'me-tab-active' : ''}`}
            onClick={() => setTab('created')}
          >
            Created ({createdEvents.length})
          </button>
          <button
            role="tab"
            aria-selected={tab === 'registered'}
            className={`me-tab ${tab === 'registered' ? 'me-tab-active' : ''}`}
            onClick={() => setTab('registered')}
          >
            Registered ({registeredEvents.length})
          </button>
        </div>

        {tab === 'created' && (
          <section className="me-section" aria-label="Created events">
            {createdEvents.length === 0 ? (
              <div className="me-empty">
                <p>You haven't created any events yet.</p>
                <Link to="/publish-event" className="me-empty-link">Create your first event</Link>
              </div>
            ) : (
              <ul className="me-event-list">
                {createdEvents.map((ev) => {
                  const sc = STATUS_CONFIG[ev.status] ?? FALLBACK_STATUS
                  const actions = getActions(ev)
                  return (
                    <li key={ev.id}>
                      <article className="me-event-card">
                        <div className="me-event-top">
                          <div className="me-event-body">
                            <h3 className="me-event-title">{ev.title}</h3>
                            <p className="me-event-meta">{formatDate(ev)}</p>
                            {ev.location && <p className="me-event-meta">{ev.location}</p>}
                          </div>
                          <span className={`me-status-badge ${sc.className}`}>{sc.label}</span>
                        </div>
                        {actions.length > 0 && (
                          <div className="me-event-actions">
                            {actions.map((a) => (
                              <button
                                key={a.action}
                                className={`me-action-btn ${a.className}`}
                                onClick={() => handleAction(ev, a.action)}
                              >
                                {a.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </article>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}

        {tab === 'registered' && (
          <section className="me-section" aria-label="Registered events">
            {registeredEvents.length === 0 ? (
              <div className="me-empty">
                <p>You haven't registered for any events yet.</p>
                <Link to="/mainpage" className="me-empty-link">Browse active events</Link>
              </div>
            ) : (
              <ul className="me-event-list">
                {registeredEvents.map((ev) => {
                  const sc = STATUS_CONFIG[ev.status] ?? FALLBACK_STATUS
                  return (
                    <li key={ev.id}>
                      <article className="me-event-card">
                        <div className="me-event-top">
                          <div className="me-event-body">
                            <h3 className="me-event-title">{ev.title}</h3>
                            <p className="me-event-meta">{formatDate(ev)}</p>
                            {ev.location && <p className="me-event-meta">{ev.location}</p>}
                          </div>
                          <span className={`me-status-badge ${sc.className}`}>{sc.label}</span>
                        </div>
                        {(ev.status === 'published' || ev.status === 'ended' || ev.status === 'cancelled') && (
                          <div className="me-event-actions">
                            <button
                              className="me-action-btn me-action-publish"
                              onClick={() => handleAction(ev, 'tasks')}
                            >
                              Tasks
                            </button>
                            {ev.status === 'published' && (
                              <button
                                className="me-action-btn me-action-danger"
                                onClick={() => handleAction(ev, 'unregister')}
                              >
                                Cancel Registration
                              </button>
                            )}
                          </div>
                        )}
                      </article>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )}
      </main>

      <footer className="me-footer">
        <p>ScottyConnect · Carnegie Mellon University</p>
      </footer>

      {deleteTarget && (
        <div className="me-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="me-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="me-modal-title">Delete Draft?</h2>
            <p className="me-modal-message">
              Are you sure you want to delete "{deleteTarget.title}"? This action cannot be undone.
            </p>
            <div className="me-modal-actions">
              <button className="me-modal-btn me-modal-btn-danger" onClick={confirmDelete}>
                Delete
              </button>
              <button className="me-modal-btn me-modal-btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
