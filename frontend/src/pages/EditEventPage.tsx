import { useParams, useNavigate, Navigate } from 'react-router-dom'
import {
  findEvent,
  updateEvent,
  storedToForm,
  EventForm,
  type EventFormData,
  type StoredEvent,
} from './CreateEventPage'

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const event = id ? findEvent(id) : undefined

  if (!event) return <Navigate to="/my-events" replace />

  function handleSave(form: EventFormData, status: StoredEvent['status']) {
    const updated: StoredEvent = {
      ...event!,
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location.trim(),
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      status,
    }
    updateEvent(updated)
    if (status === 'published') {
      navigate('/event-published', { state: { eventId: updated.id } })
    }
  }

  return (
    <EventForm
      initialData={storedToForm(event)}
      pageTitle="Edit draft event"
      pageSubtitle="Update the details below. You can save as draft or publish when ready."
      backTo="/my-events"
      backLabel="Back to My Events"
      onSave={handleSave}
    />
  )
}
