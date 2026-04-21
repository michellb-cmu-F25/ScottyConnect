import StorageUtil from '../common/StorageUtil'

export interface Appointment {
  id: string
  sender_id: string
  sender_name: string
  receiver_id: string
  receiver_name: string
  scheduled_at: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'
  created_at: string
}

export interface UserProfile {
  id: string
  username: string
  email: string
  role: string
  bio: string
  tags: string[]
}

/**
 * Shared authentication headers for API requests.
 */
export function authHeaders(contentType = false): HeadersInit {
  const token = StorageUtil.getToken()
  const headers: Record<string, string> = {}
  if (contentType) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

/**
 * Generates 30-minute time slots from 9:00 AM to 4:00 PM.
 */
export function generateTimeSlots(): string[] {
  const slots = []
  for (let hour = 9; hour <= 16; hour++) {
    const hStr = hour > 12 ? (hour - 12).toString() : hour.toString()
    const ampm = hour >= 12 ? 'PM' : 'AM'
    slots.push(`${hStr}:00 ${ampm}`)
    if (hour < 16) {
      slots.push(`${hStr}:30 ${ampm}`)
    }
  }
  return slots
}

/**
 * Gets a list of future date strings (YYYY-MM-DD) in Mountain View time.
 */
export function getFutureDateStrings(daysAhead = 14): string[] {
  const dateStrings = []
  const nowMV = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(nowMV)
    d.setDate(d.getDate() + i)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    dateStrings.push(`${year}-${month}-${day}`)
  }
  return dateStrings
}

/**
 * Formats a YYYY-MM-DD string into a human-readable label.
 */
export function getDateLabel(dateString: string): string {
  if (!dateString) return ''
  const d = new Date(dateString)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

/**
 * Converts a 12-hour time string (e.g. "2:30 PM") to 24-hour format ("14:30").
 */
export function convertTimeTo24Hour(time: string): string {
  const [clock, period] = time.split(' ')
  let [hour, minute] = clock.split(':').map(Number)
  if (period === 'PM' && hour < 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/**
 * Checks if a given date/time slot is in the past according to Mountain View time.
 */
export function isTimePastInMV(dateString: string, timeString: string): boolean {
  if (!dateString) return false
  const nowMV = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
  const year = nowMV.getFullYear()
  const month = String(nowMV.getMonth() + 1).padStart(2, '0')
  const day = String(nowMV.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
  
  if (dateString < todayStr) return true
  if (dateString > todayStr) return false
  
  const time24 = convertTimeTo24Hour(timeString)
  const [hour, min] = time24.split(':').map(Number)
  
  if (hour < nowMV.getHours()) return true
  if (hour === nowMV.getHours() && min <= nowMV.getMinutes()) return true
  return false
}

/**
 * Builds an ISO-like local datetime string for the backend.
 */
export function buildScheduledAt(dateString: string, time: string): string {
  if (!dateString || !time) return ''
  return `${dateString}T${convertTimeTo24Hour(time)}:00`
}

/**
 * Formats a backend scheduled_at string into a consistent display label.
 */
export function formatScheduledAt(scheduledAt: string): string {
  try {
    const normalized = scheduledAt.trim().replace(' ', 'T')
    const isoPrefix = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
    if (!isoPrefix) return scheduledAt

    const [, year, month, day, hh, mm] = isoPrefix
    const hour24 = Number(hh)
    const hour12 = hour24 % 12 || 12
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    return `${year}-${month}-${day} ${hour12}:${mm} ${ampm}`
  } catch {
    return scheduledAt
  }
}
