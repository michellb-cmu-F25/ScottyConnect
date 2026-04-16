import { snakeToCamel } from '../services/ServiceUtils'

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

export function apiEventFromSnake(raw: Record<string, unknown>): EventFromAPI {
  const event = snakeToCamel(raw) as Record<string, unknown>
  return {
    id: event.id as string,
    title: event.title as string,
    description: event.description as string,
    date: (event.date as string) ?? null,
    startTime: (event.startTime as string) ?? null,
    endTime: (event.endTime as string) ?? null,
    location: (event.location as string) ?? null,
    capacity: (event.capacity as number) ?? null,
    status: event.status as EventFromAPI['status'],
    ownerId: event.ownerId as string,
    createdAt: event.createdAt as string,
    updatedAt: (event.updatedAt as string) ?? '',
  }
}
