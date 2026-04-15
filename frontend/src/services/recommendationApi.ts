import StorageUtil, { type RecommendationStrategy } from '../common/StorageUtil'
import type { EventFromAPI } from './eventApi'

interface APIRecommendationResponse {
  message: string
  strategy: string
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
    updatedAt: (obj.updated_at as string) ?? '',
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

/** Fetch ranked, published event recommendations for a user. */
export async function getRecommendations(
  userId: string,
  strategy: RecommendationStrategy,
  limit: number = 20,
): Promise<EventFromAPI[]> {
  const url = `/api/recommendation/${encodeURIComponent(userId)}?strategy=${encodeURIComponent(strategy)}&limit=${limit}`
  const res = await fetch(url, { headers: authHeaders() })
  const data: APIRecommendationResponse = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Failed to load recommendations')
  }
  return data.events.map((e) => snakeToCamel(e))
}
