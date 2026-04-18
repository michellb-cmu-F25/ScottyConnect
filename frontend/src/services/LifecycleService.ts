import { authHeaders } from './ServiceUtils'
import { apiEventFromSnake, type EventFromAPI } from '../schemas/event'
import type { StoredEvent } from '../types/event'

interface APIEventResponse {
  message: string
  event: Record<string, unknown> | null
  code: number
}

interface APIEventListResponse {
  message: string
  events: Record<string, unknown>[]
  code: number
}

export type { EventFromAPI } from '../schemas/event'

export function apiEventToStored(ev: EventFromAPI): StoredEvent {
  return {
    id: ev.id,
    title: ev.title,
    description: ev.description,
    date: ev.date ?? '',
    startTime: ev.startTime ?? '',
    endTime: ev.endTime ?? '',
    location: ev.location ?? '',
    capacity: ev.capacity,
    status: ev.status,
    ownerId: ev.ownerId,
    createdAt: ev.createdAt,
  }
}

export async function createEvent(
  form: {
    title: string
    description: string
    date: string
    startTime: string
    endTime: string
    location: string
    capacity: string
  },
  status: 'draft' | 'published',
): Promise<EventFromAPI> {
  const res = await fetch('/api/lifecycle/events', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      start_time: form.startTime,
      end_time: form.endTime,
      location: form.location.trim(),
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      status,
    }),
  })

  const data: APIEventResponse = await res.json()
  if (!res.ok || !data.event) {
    throw new Error(data.message || 'Failed to create event')
  }
  return apiEventFromSnake(data.event)
}

export async function getEvent(eventId: string): Promise<EventFromAPI> {
  const res = await fetch(`/api/lifecycle/events/${encodeURIComponent(eventId)}`)
  const data: APIEventResponse = await res.json()
  if (!res.ok || !data.event) {
    throw new Error(data.message || 'Event not found')
  }
  return apiEventFromSnake(data.event)
}

export async function listMyEvents(): Promise<EventFromAPI[]> {
  const res = await fetch('/api/lifecycle/events/mine', {
    headers: authHeaders(),
  })
  const data: APIEventListResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load your events')
  }
  return data.events.map((e) => apiEventFromSnake(e))
}

export async function listPublishedEvents(): Promise<EventFromAPI[]> {
  const res = await fetch('/api/lifecycle/events/published')
  const data: APIEventListResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load events')
  }
  return data.events.map((e) => apiEventFromSnake(e))
}

export async function updateEvent(
  eventId: string,
  form: {
    title: string
    description: string
    date: string
    startTime: string
    endTime: string
    location: string
    capacity: string
  },
  status: 'draft' | 'published',
): Promise<EventFromAPI> {
  const res = await fetch(`/api/lifecycle/events/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      title: form.title.trim(),
      description: form.description.trim(),
      date: form.date,
      start_time: form.startTime,
      end_time: form.endTime,
      location: form.location.trim(),
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      status,
    }),
  })
  const data: APIEventResponse = await res.json()
  if (!res.ok || !data.event) {
    throw new Error(data.message || 'Failed to update event')
  }
  return apiEventFromSnake(data.event)
}

export async function deleteEventApi(eventId: string): Promise<void> {
  const res = await fetch(`/api/lifecycle/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  const data: APIEventResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete event')
  }
}

export async function transitionEventApi(
  eventId: string,
  targetStatus: string,
): Promise<EventFromAPI> {
  const res = await fetch(`/api/lifecycle/events/${encodeURIComponent(eventId)}/transition`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ target_status: targetStatus }),
  })
  const data: APIEventResponse = await res.json()
  if (!res.ok || !data.event) {
    throw new Error(data.message || 'Failed to update event status')
  }
  return apiEventFromSnake(data.event)
}

// ---- Event Tags ----

interface APIEventTagsResponse {
  message: string
  event_id: string
  tag_ids: string[]
  code: number
}

export async function getEventTags(eventId: string): Promise<string[]> {
  const url = `/api/recommendation/event-tags/${encodeURIComponent(eventId)}`
  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) {
    throw new Error(`Failed to load event tags: ${res.status} ${res.statusText}`)
  }
  const data: APIEventTagsResponse = await res.json()
  return data.tag_ids
}

export async function setEventTags(eventId: string, tagIds: string[]): Promise<string[]> {
  const url = `/api/recommendation/event-tags/${encodeURIComponent(eventId)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ tag_ids: tagIds }),
  })
  if (!res.ok) {
    throw new Error(`Failed to save event tags: ${res.status} ${res.statusText}`)
  }
  const data: APIEventTagsResponse = await res.json()
  return data.tag_ids
}

export async function deleteEventTags(eventId: string): Promise<void> {
  const url = `/api/recommendation/event-tags/${encodeURIComponent(eventId)}`
  const res = await fetch(url, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok) {
    throw new Error(`Failed to delete event tags: ${res.status} ${res.statusText}`)
  }
}
