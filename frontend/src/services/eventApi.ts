import StorageUtil from '../common/StorageUtil'
import type { StoredEvent } from '../types/event'

export interface EventFromAPI {
  id: string
  title: string
  description: string
  date: string | null
  startTime: string | null
  endTime: string | null
  location: string | null
  capacity: number | null
  status: 'draft' | 'published' | 'ended' | 'cancelled'
  ownerId: string
  createdAt: string
  updatedAt: string
}

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

function snakeToCamel(obj: Record<string, unknown>): EventFromAPI {
  return {
    id: obj.id as string,
    title: obj.title as string,
    description: obj.description as string,
    date: (obj.date as string) ?? null,
    startTime: (obj.start_time as string) ?? null,
    endTime: (obj.end_time as string) ?? null,
    location: (obj.location as string) ?? null,
    capacity: (obj.capacity as number) ?? null,
    status: obj.status as EventFromAPI['status'],
    ownerId: obj.owner_id as string,
    createdAt: obj.created_at as string,
    updatedAt: obj.updated_at as string,
  }
}

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

function authHeaders(): Record<string, string> {
  const token = StorageUtil.getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
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
  return snakeToCamel(data.event)
}

export async function getEvent(eventId: string): Promise<EventFromAPI> {
  const res = await fetch(`/api/lifecycle/events/${encodeURIComponent(eventId)}`)
  const data: APIEventResponse = await res.json()
  if (!res.ok || !data.event) {
    throw new Error(data.message || 'Event not found')
  }
  return snakeToCamel(data.event)
}

export async function listMyEvents(): Promise<EventFromAPI[]> {
  const res = await fetch('/api/lifecycle/events/mine', {
    headers: authHeaders(),
  })
  const data: APIEventListResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load your events')
  }
  return data.events.map((e) => snakeToCamel(e))
}

export async function listPublishedEvents(): Promise<EventFromAPI[]> {
  const res = await fetch('/api/lifecycle/events/published')
  const data: APIEventListResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load events')
  }
  return data.events.map((e) => snakeToCamel(e))
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
  return snakeToCamel(data.event)
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
  return snakeToCamel(data.event)
}
