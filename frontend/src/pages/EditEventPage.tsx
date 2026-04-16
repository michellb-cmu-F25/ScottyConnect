import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { getEvent, updateEvent, apiEventToStored } from '../services/LifecycleService'
import { storedToForm, EventForm, type EventFormData, type StoredEvent } from './CreateEventPage'
import '../styles/CreateEvent.css'

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<StoredEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const ev = await getEvent(id)
        if (!cancelled) setEvent(apiEventToStored(ev))
      } catch {
        if (!cancelled) setEvent(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (!id) return <Navigate to="/my-events" replace />

  if (loading) {
    return (
      <div className="create-event-page">
        <main className="create-event-content">
          <p className="create-event-subtitle">Loading…</p>
        </main>
      </div>
    )
  }

  if (!event) return <Navigate to="/my-events" replace />

  if (event.status !== 'draft') {
    return <Navigate to="/my-events" replace />
  }

  async function handleSave(form: EventFormData, status: StoredEvent['status']) {
    const current = event
    if (!current) return
    setSaveError('')
    try {
      await updateEvent(current.id, form, status as 'draft' | 'published')
      if (status === 'published') {
        navigate('/event-published', { state: { eventId: current.id } })
      } else {
        navigate('/my-events')
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  return (
    <>
      {saveError && <div className="create-event-error">{saveError}</div>}
      <EventForm
        initialData={storedToForm(event)}
        pageTitle="Edit draft event"
        pageSubtitle="Update the details below. You can save as draft or publish when ready."
        backTo="/my-events"
        backLabel="Back to My Events"
        onSave={handleSave}
      />
    </>
  )
}
