import { authHeaders } from './ServiceUtils'
import { apiUserFromSnake, type PublicUser } from '../schemas/user'

interface APIRegisterEventResponse {
  registered: boolean
  message: string
  code: number
}

interface APIAttendEventResponse {
  attended: boolean
  message: string
  code: number
}

interface APIAttendanceRecordResponse {
  message: string
  code: number
  users: Record<string, unknown>[]
}

export async function getRegisteredUsers(eventId: string): Promise<PublicUser[]> {
  const res = await fetch(`/api/attendance/register/events/${encodeURIComponent(eventId)}/users`, {
    headers: authHeaders(),
  })
  const data: APIAttendanceRecordResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load registered users')
  }
  return data.users.map((user) => apiUserFromSnake(user))
}

export async function getRegistrationStatus(eventId: string): Promise<boolean> {
  const res = await fetch(`/api/attendance/register/events/${encodeURIComponent(eventId)}`, {
    headers: authHeaders(),
  })
  const data: APIRegisterEventResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load registration status')
  }
  return data.registered
}

export async function getAttendedUsers(eventId: string): Promise<PublicUser[]> {
  const res = await fetch(`/api/attendance/attend/events/${encodeURIComponent(eventId)}/users`, {
    headers: authHeaders(),
  })
  const data: APIAttendanceRecordResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load attended users')
  }
  return data.users.map((user) => apiUserFromSnake(user))
}

export async function getAttendanceStatus(eventId: string): Promise<boolean> {
  const res = await fetch(`/api/attendance/attend/events/${encodeURIComponent(eventId)}`, {
    headers: authHeaders(),
  })
  const data: APIAttendEventResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load attendance status')
  }
  return data.attended
}

export async function registerEvent(eventId: string): Promise<boolean> {
  const res = await fetch(`/api/attendance/register/events/${encodeURIComponent(eventId)}`, {
    method: 'POST',
    headers: authHeaders(),
  })
  const data: APIRegisterEventResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to register for event')
  }
  return data.registered
}

export async function unregisterEvent(eventId: string): Promise<boolean> {
  const res = await fetch(`/api/attendance/register/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  const data: APIRegisterEventResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to unregister from event')
  }
  return data.registered
}

export async function attendEvent(eventId: string, userId: string): Promise<boolean> {
  const res = await fetch(
    `/api/attendance/attend/events/${encodeURIComponent(eventId)}/users/${encodeURIComponent(userId)}`,
    {
      method: 'POST',
      headers: authHeaders(),
    },
  )
  const data: APIAttendEventResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to mark attendance')
  }
  return data.attended
}

export async function unattendEvent(eventId: string, userId: string): Promise<boolean> {
  const res = await fetch(
    `/api/attendance/attend/events/${encodeURIComponent(eventId)}/users/${encodeURIComponent(userId)}`,
    {
      method: 'DELETE',
      headers: authHeaders(),
    },
  )
  const data: APIAttendEventResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to remove attendance mark')
  }
  return data.attended
}
