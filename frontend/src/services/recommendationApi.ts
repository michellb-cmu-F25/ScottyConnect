import StorageUtil, { type RecommendationStrategy } from '../common/StorageUtil'
import type { EventFromAPI } from './eventApi'

interface APIRecommendationResponse {
  message: string
  strategy: string
  events: Record<string, unknown>[]
  code: number
}

interface APIPreferenceResponse {
  message: string
  user_id: string
  preferred_strategy: string
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

const VALID_STRATEGIES: RecommendationStrategy[] = ['tag', 'popularity', 'hybrid']

function coerceStrategy(raw: string): RecommendationStrategy {
  return (VALID_STRATEGIES as string[]).includes(raw)
    ? (raw as RecommendationStrategy)
    : 'hybrid'
}

/** Fetch the user's saved recommendation strategy preference. */
export async function getUserPreference(userId: string): Promise<RecommendationStrategy> {
  const url = `/api/recommendation/preferences/${encodeURIComponent(userId)}`
  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) {
    throw new Error(`Failed to load preference: ${res.status} ${res.statusText}`)
  }
  const data: APIPreferenceResponse = await res.json()
  return coerceStrategy(data.preferred_strategy)
}

/** Save the user's preferred recommendation strategy. */
export async function setUserPreference(
  userId: string,
  strategy: RecommendationStrategy,
): Promise<RecommendationStrategy> {
  const url = `/api/recommendation/preferences/${encodeURIComponent(userId)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ preferred_strategy: strategy }),
  })
  if (!res.ok) {
    throw new Error(`Failed to save preference: ${res.status} ${res.statusText}`)
  }
  const data: APIPreferenceResponse = await res.json()
  return coerceStrategy(data.preferred_strategy)
}

// ---- Tags ------------------------------------------------------------------

export interface Tag {
  id: string
  slug: string
  displayName: string | null
}

interface APITagListResponse {
  message: string
  tags: Array<{ id: string; slug: string; display_name: string | null }>
  code: number
}

interface APIUserTagsResponse {
  message: string
  user_id: string
  tag_ids: string[]
  code: number
}

/** Fetch every selectable tag. */
export async function getAllTags(): Promise<Tag[]> {
  const res = await fetch('/api/recommendation/tags', { headers: authHeaders() })
  if (!res.ok) {
    throw new Error(`Failed to load tags: ${res.status} ${res.statusText}`)
  }
  const data: APITagListResponse = await res.json()
  return data.tags.map((t) => ({
    id: t.id,
    slug: t.slug,
    displayName: t.display_name,
  }))
}

/** Fetch the tag_ids the user is currently interested in. */
export async function getUserTags(userId: string): Promise<string[]> {
  const url = `/api/recommendation/user-tags/${encodeURIComponent(userId)}`
  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) {
    throw new Error(`Failed to load user tags: ${res.status} ${res.statusText}`)
  }
  const data: APIUserTagsResponse = await res.json()
  return data.tag_ids
}

/** Replace the user's interested-tag set with the provided list. */
export async function setUserTags(userId: string, tagIds: string[]): Promise<string[]> {
  const url = `/api/recommendation/user-tags/${encodeURIComponent(userId)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ tag_ids: tagIds }),
  })
  if (!res.ok) {
    throw new Error(`Failed to save user tags: ${res.status} ${res.statusText}`)
  }
  const data: APIUserTagsResponse = await res.json()
  return data.tag_ids
}
