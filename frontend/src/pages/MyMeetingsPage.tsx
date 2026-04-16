import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StorageUtil from '../common/StorageUtil'
import '../styles/MyMeetings.css'

interface Appointment {
  id: string
  sender_id: string
  sender_name: string
  receiver_id: string
  receiver_name: string
  scheduled_at: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED'
  created_at: string
}

function isScheduledAtPast(scheduledAt: string): boolean {
  try {
    const parsed = new Date(scheduledAt)
    return !isNaN(parsed.getTime()) && parsed < new Date()
  } catch {
    return false
  }
}

type TabType = 'upcoming' | 'past'
const UPCOMING_STATUS_PRIORITY: Record<Appointment['status'], number> = {
  ACCEPTED: 0,
  PENDING: 1,
  DECLINED: 2,
  CANCELLED: 3,
}

function formatScheduledAt(scheduledAt: string): string {
  try {
    const normalized = scheduledAt.trim().replace(' ', 'T')
    const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(normalized)

    // If backend returns timezone-aware datetime (e.g. UTC), convert to user's local time.
    if (hasTimezone) {
      const parsed = new Date(normalized)
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear()
        const month = String(parsed.getMonth() + 1).padStart(2, '0')
        const day = String(parsed.getDate()).padStart(2, '0')
        const hour24 = parsed.getHours()
        const minute = String(parsed.getMinutes()).padStart(2, '0')
        const hour12 = hour24 % 12 || 12
        const ampm = hour24 >= 12 ? 'PM' : 'AM'
        return `${year}-${month}-${day} ${hour12}:${minute} ${ampm}`
      }
    }

    // If datetime has no timezone, treat it as wall-clock local booking time.
    const isoPrefix = normalized.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/
    )
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

export default function MyMeetingsPage() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const cached = sessionStorage.getItem('scotty_networking_appointments')
    return cached ? JSON.parse(cached) : []
  })
  const [activeTab, setActiveTab] = useState<TabType>('upcoming')
  const [loading, setLoading] = useState(!sessionStorage.getItem('scotty_networking_appointments'))
  const [fetchError, setFetchError] = useState('')
  const [message, setMessage] = useState('')
  const [alertBox, setAlertBox] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function showAlertBox(type: 'success' | 'error', text: string) {
    setAlertBox({ type, text })
    setTimeout(() => setAlertBox(null), 3500)
  }

  function authHeaders(contentType = false): HeadersInit {
    const token = StorageUtil.getToken()
    const headers: Record<string, string> = {}
    if (contentType) headers['Content-Type'] = 'application/json'
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  async function fetchAppointments() {
    const user = StorageUtil.getUser()
    if (!user?.id) {
      // No session — redirect to login
      navigate('/login')
      return
    }
    setFetchError('')
    try {
      const res = await fetch(`/api/networking/appointments/${user.id}`, {
        headers: authHeaders()
      })
      if (res.status === 401) {
        navigate('/login')
        return
      }
      if (!res.ok) {
        setFetchError(`Failed to load meetings (${res.status})`)
        setLoading(false)
        return
      }
      const data = await res.json()
      const returnedAppointments = data.appointments || []
      setAppointments(returnedAppointments)
      sessionStorage.setItem('scotty_networking_appointments', JSON.stringify(returnedAppointments))
    } catch (err) {
      setFetchError('Network error — could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRespond(inviteId: string, accept: boolean) {
    try {
      const res = await fetch('/api/networking/respond', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ invite_id: inviteId, accept })
      })
      if (res.ok) {
        const successMessage = accept ? 'Meeting accepted!' : 'Meeting declined.'
        setMessage(successMessage)
        showAlertBox('success', successMessage)
        setTimeout(() => setMessage(''), 3000)
        fetchAppointments()
      } else {
        const data = await res.json()
        const errorMessage = data.message || 'Failed to respond to invitation.'
        setMessage(errorMessage)
        showAlertBox('error', errorMessage)
      }
    } catch {
      const errorMessage = 'Error connecting to server.'
      setMessage(errorMessage)
      showAlertBox('error', errorMessage)
    }
  }

  async function handleCancel(inviteId: string) {
    try {
      const res = await fetch('/api/networking/cancel', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ invite_id: inviteId })
      })
      if (res.ok) {
        const successMessage = 'Invitation cancelled.'
        setMessage(successMessage)
        showAlertBox('success', successMessage)
        setTimeout(() => setMessage(''), 3000)
        fetchAppointments()
      } else {
        const data = await res.json()
        const errorMessage = data.message || 'Failed to cancel invitation.'
        setMessage(errorMessage)
        showAlertBox('error', errorMessage)
      }
    } catch {
      const errorMessage = 'Error connecting to server.'
      setMessage(errorMessage)
      showAlertBox('error', errorMessage)
    }
  }


  const user = StorageUtil.getUser()

  const activeAppointments = appointments.filter(a => a.status !== 'CANCELLED')
  const upcoming = activeAppointments
    .filter(a => !isScheduledAtPast(a.scheduled_at))
    .sort((a, b) => {
      const priorityDiff = UPCOMING_STATUS_PRIORITY[a.status] - UPCOMING_STATUS_PRIORITY[b.status]
      if (priorityDiff !== 0) return priorityDiff
      return a.scheduled_at.localeCompare(b.scheduled_at)
    })
  const past = activeAppointments
    .filter(a => isScheduledAtPast(a.scheduled_at))
    .sort((a, b) => {
      const priorityDiff = UPCOMING_STATUS_PRIORITY[a.status] - UPCOMING_STATUS_PRIORITY[b.status]
      if (priorityDiff !== 0) return priorityDiff
      return a.scheduled_at.localeCompare(b.scheduled_at)
    })
  const upcomingCount = upcoming.length
  const pastCount = past.length
  const displayed = activeTab === 'upcoming' ? upcoming : past

  function getOtherName(appt: Appointment) {
    const isSender = appt.sender_id === user?.id
    return isSender ? appt.receiver_name : appt.sender_name
  }

  function getDirectionLabel(appt: Appointment) {
    return appt.sender_id === user?.id ? 'Outgoing' : 'Incoming'
  }

  function getStatusMeta(appt: Appointment) {
    const isPast = isScheduledAtPast(appt.scheduled_at)
    return {
      label: appt.status,
      isPast,
    }
  }

  if (loading) return (
    <div className="meetings-page">
      <div className="meetings-loading">
        <div className="meetings-spinner" />
        <p>Loading your meetings...</p>
      </div>
    </div>
  )

  if (fetchError) return (
    <div className="meetings-page">
      <header className="meetings-header">
        <div className="meetings-header-nav">
          <Link to="/networking" className="meetings-back-btn">← Networking Hub</Link>
        </div>
        <div className="meetings-header-content">
          <h1>My Coffee Chats</h1>
        </div>
      </header>
      <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
        <p>{fetchError}</p>
        <button className="meetings-cta-btn" style={{ marginTop: '16px' }} onClick={fetchAppointments}>
          Retry
        </button>
      </div>
    </div>
  )

  return (
    <div className="meetings-page">
      {alertBox && (
        <div className={`meetings-alertbox meetings-alertbox--${alertBox.type}`} role="alert">
          <div className="meetings-alertbox-body">
            <span className="meetings-alertbox-icon">{alertBox.type === 'success' ? '✓' : '!'}</span>
            <span>{alertBox.text}</span>
          </div>
          <button
            className="meetings-alertbox-close"
            onClick={() => setAlertBox(null)}
            aria-label="Close notification"
          >
            &times;
          </button>
        </div>
      )}
      {/* Header */}
      <header className="meetings-header">
        <div className="meetings-header-nav">
          <Link to="/networking" className="meetings-back-btn">
            ← Networking Hub
          </Link>
        </div>
        <div className="meetings-header-content">
          <h1>My Coffee Chats</h1>
          <p>Track upcoming and past meetings with actual DB status labels.</p>
        </div>

        {/* Stats Row */}
        <div className="meetings-stats">
          <div className="meetings-stat-card">
            <span className="meetings-stat-num">{activeAppointments.length}</span>
            <span className="meetings-stat-label">Total</span>
          </div>
          <div className="meetings-stat-card">
            <span className="meetings-stat-num">{upcomingCount}</span>
            <span className="meetings-stat-label">Upcoming</span>
          </div>
          <div className="meetings-stat-card">
            <span className="meetings-stat-num">{pastCount}</span>
            <span className="meetings-stat-label">Past</span>
          </div>
        </div>
      </header>

      {message && (
        <div className="meetings-toast">{message}</div>
      )}

      <div className="meetings-tabs">
        <button
          className={`meetings-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
          {upcomingCount > 0 && <span className="meetings-tab-badge">{upcomingCount}</span>}
        </button>
        <button
          className={`meetings-tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past
          {pastCount > 0 && <span className="meetings-tab-badge meetings-tab-badge--muted">{pastCount}</span>}
        </button>
      </div>

      {/* Meeting Cards */}
      <main className="meetings-list">
        {displayed.length === 0 ? (
          <div className="meetings-empty">
            <span className="meetings-empty-icon">📅</span>
            <h3>No meetings yet</h3>
            <p>Head to the Networking Hub to propose a coffee chat!</p>
            <Link to="/networking" className="meetings-cta-btn">
              Find People to Connect With
            </Link>
          </div>
        ) : (
          displayed.map(appt => {
            const isSender = appt.sender_id === user?.id
            const meta = getStatusMeta(appt)

            return (
              <article key={appt.id} className={[
                'meeting-card',
                `meeting-card--${appt.status.toLowerCase()}`,
                isScheduledAtPast(appt.scheduled_at) ? 'meeting-card--past' : '',
                appt.status === 'ACCEPTED' && isScheduledAtPast(appt.scheduled_at) ? 'meeting-card--past-accepted' : ''
              ].filter(Boolean).join(' ')}>
                <div className="meeting-card-left">
                  <div className="meeting-avatar">
                    {getOtherName(appt).charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="meeting-card-body">
                  <div className="meeting-card-top">
                    <div>
                      <span className="meeting-direction">{getDirectionLabel(appt)}</span>
                      <h2 className="meeting-name">{getOtherName(appt)}</h2>
                    </div>
                    <span className={[
                      'meeting-status-badge',
                      `status-${appt.status.toLowerCase()}`,
                      getStatusMeta(appt).isPast ? 'status-past' : ''
                    ].filter(Boolean).join(' ')}>
                      {getStatusMeta(appt).label}
                    </span>
                  </div>

                  <div className="meeting-timeslot">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                      {formatScheduledAt(appt.scheduled_at)}
                    {appt.status === 'PENDING' && !isScheduledAtPast(appt.scheduled_at) && (
                      isSender ? (
                        <button
                          className="meeting-btn meeting-btn--cancel"
                          onClick={() => handleCancel(appt.id)}
                        >
                          Cancel Invite
                        </button>
                      ) : (
                        <>
                          <button
                            className="meeting-btn meeting-btn--accept"
                            onClick={() => handleRespond(appt.id, true)}
                          >
                            Accept
                          </button>
                          <button
                            className="meeting-btn meeting-btn--decline"
                            onClick={() => handleRespond(appt.id, false)}
                          >
                            Decline
                          </button>
                        </>
                      )
                    )}
                    {appt.status === 'ACCEPTED' && !isScheduledAtPast(appt.scheduled_at) && (
                      <button
                        className="meeting-btn meeting-btn--cancel"
                        onClick={() => handleCancel(appt.id)}
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </main>
    </div>
  )
}
