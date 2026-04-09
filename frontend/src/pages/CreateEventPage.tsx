import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StorageUtil from '../common/StorageUtil'
import '../styles/CreateEvent.css'

export interface EventFormData {
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  capacity: string
}

const EVENTS_STORAGE_KEY = 'scottyConnectEvents'

function loadEvents(): StoredEvent[] {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveEvent(event: StoredEvent) {
  const events = loadEvents()
  events.push(event)
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
}

function updateEvent(updated: StoredEvent) {
  const events = loadEvents()
  const idx = events.findIndex((e) => e.id === updated.id)
  if (idx === -1) return
  events[idx] = updated
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
}

function deleteEvent(eventId: string) {
  const events = loadEvents().filter((e) => e.id !== eventId)
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events))
}

function findEvent(eventId: string): StoredEvent | undefined {
  return loadEvents().find((e) => e.id === eventId)
}

export interface StoredEvent {
  id: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  capacity: number | null
  status: 'draft' | 'published' | 'ended' | 'cancelled'
  ownerId: string
  createdAt: string
}

export { EVENTS_STORAGE_KEY, loadEvents, updateEvent, deleteEvent, findEvent }

const EMPTY_FORM: EventFormData = {
  title: '',
  description: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  capacity: '',
}

export function storedToForm(ev: StoredEvent): EventFormData {
  return {
    title: ev.title,
    description: ev.description,
    date: ev.date,
    startTime: ev.startTime,
    endTime: ev.endTime,
    location: ev.location,
    capacity: ev.capacity != null ? String(ev.capacity) : '',
  }
}

interface EventFormProps {
  initialData?: EventFormData
  pageTitle: string
  pageSubtitle: string
  backTo: string
  backLabel: string
  onSave: (form: EventFormData, status: StoredEvent['status']) => void
}

export function EventForm({ initialData, pageTitle, pageSubtitle, backTo, backLabel, onSave }: EventFormProps) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [form, setForm] = useState<EventFormData>(initialData ?? EMPTY_FORM)

  function update(field: keyof EventFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const isValid =
    form.title.trim() !== '' &&
    form.description.trim() !== '' &&
    form.date !== '' &&
    form.startTime !== '' &&
    form.endTime !== '' &&
    form.location.trim() !== ''

  function handleSubmit(status: StoredEvent['status']) {
    if (!isValid) return
    setSubmitting(true)
    onSave(form, status)
    setSubmitting(false)
    if (status === 'draft') {
      setShowDraftModal(true)
    }
  }

  function onFormSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setSubmitting(true)
    onSave(form, 'published')
    setSubmitting(false)
  }

  return (
    <div className="create-event-page">
      <header className="create-event-header">
        <div className="create-event-header-inner">
          <Link to={backTo} className="create-event-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="create-event-content">
        <h1 className="create-event-title">{pageTitle}</h1>
        <p className="create-event-subtitle">{pageSubtitle}</p>

        <form className="create-event-form" onSubmit={onFormSubmit}>
          <div className="create-event-card">
            <h2 className="create-event-card-title">Event details</h2>
            <div className="create-event-fields">
              <div className="create-event-field">
                <label className="create-event-label" htmlFor="ev-title">
                  Event title <span className="required">*</span>
                </label>
                <input
                  id="ev-title"
                  className="create-event-input"
                  type="text"
                  placeholder="e.g. CMU-SV Carnival"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  required
                />
              </div>
              <div className="create-event-field">
                <label className="create-event-label" htmlFor="ev-desc">
                  Description <span className="required">*</span>
                </label>
                <textarea
                  id="ev-desc"
                  className="create-event-textarea"
                  placeholder="Tell attendees what this event is about..."
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  required
                />
              </div>
              <div className="create-event-field">
                <label className="create-event-label" htmlFor="ev-location">
                  Location <span className="required">*</span>
                </label>
                <input
                  id="ev-location"
                  className="create-event-input"
                  type="text"
                  placeholder="e.g. CMUSV Building 23"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="create-event-card">
            <h2 className="create-event-card-title">Schedule</h2>
            <div className="create-event-fields">
              <div className="create-event-field">
                <label className="create-event-label" htmlFor="ev-date">
                  Date <span className="required">*</span>
                </label>
                <input
                  id="ev-date"
                  className="create-event-input"
                  type="date"
                  value={form.date}
                  onChange={(e) => update('date', e.target.value)}
                  required
                />
              </div>
              <div className="create-event-row">
                <div className="create-event-field">
                  <label className="create-event-label" htmlFor="ev-start">
                    Start time <span className="required">*</span>
                  </label>
                  <input
                    id="ev-start"
                    className="create-event-input"
                    type="time"
                    value={form.startTime}
                    onChange={(e) => update('startTime', e.target.value)}
                    required
                  />
                </div>
                <div className="create-event-field">
                  <label className="create-event-label" htmlFor="ev-end">
                    End time <span className="required">*</span>
                  </label>
                  <input
                    id="ev-end"
                    className="create-event-input"
                    type="time"
                    value={form.endTime}
                    onChange={(e) => update('endTime', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="create-event-card">
            <h2 className="create-event-card-title">Capacity</h2>
            <div className="create-event-fields">
              <div className="create-event-field">
                <label className="create-event-label" htmlFor="ev-capacity">
                  Maximum attendees
                </label>
                <input
                  id="ev-capacity"
                  className="create-event-input"
                  type="number"
                  min="1"
                  placeholder="Leave blank for unlimited"
                  value={form.capacity}
                  onChange={(e) => update('capacity', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="create-event-actions">
            <button
              type="submit"
              className="create-event-btn create-event-btn-publish"
              disabled={!isValid || submitting}
            >
              Publish Event
            </button>
            <button
              type="button"
              className="create-event-btn create-event-btn-draft"
              disabled={!isValid || submitting}
              onClick={() => handleSubmit('draft')}
            >
              Save as Draft
            </button>
            <button
              type="button"
              className="create-event-btn create-event-btn-cancel"
              onClick={() => navigate(backTo)}
            >
              Cancel
            </button>
          </div>
        </form>
      </main>

      <footer className="create-event-footer">
        <p>ScottyConnect · Carnegie Mellon University</p>
      </footer>

      {showDraftModal && (
        <div className="draft-modal-overlay" onClick={() => setShowDraftModal(false)}>
          <div className="draft-modal" onClick={(e) => e.stopPropagation()}>
            <div className="draft-modal-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4 12 14.01l-3-3" />
              </svg>
            </div>
            <h2 className="draft-modal-title">Draft Saved Successfully</h2>
            <p className="draft-modal-message">
              Your event has been saved as a draft. You can go to My Events to view and edit it later.
            </p>
            <div className="draft-modal-actions">
              <button
                className="draft-modal-btn draft-modal-btn-primary"
                onClick={() => navigate('/my-events')}
              >
                Go to My Events
              </button>
              <button
                className="draft-modal-btn draft-modal-btn-secondary"
                onClick={() => navigate('/mainpage')}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CreateEventPage() {
  const navigate = useNavigate()

  function handleSave(form: EventFormData, status: StoredEvent['status']) {
    const user = StorageUtil.getUser()
    const event: StoredEvent = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location.trim(),
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      status,
      ownerId: user.id ?? 'anonymous',
      createdAt: new Date().toISOString(),
    }
    saveEvent(event)
    if (status === 'published') {
      navigate('/event-published', { state: { eventId: event.id } })
    }
  }

  return (
    <EventForm
      pageTitle="Create new event"
      pageSubtitle="Fill in the details below to create a new event for the ScottyConnect community."
      backTo="/mainpage"
      backLabel="Back to home"
      onSave={handleSave}
    />
  )
}
