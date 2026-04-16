import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import StorageUtil from '../common/StorageUtil'
import '../styles/Networking.css'

interface UserProfile {
  id: string
  username: string
  email: string
  role: string
  bio: string
  tags: string[]
}

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

export default function NetworkingPage() {
  const [discoverUsers, setDiscoverUsers] = useState<UserProfile[]>(() => {
    const cached = sessionStorage.getItem('scotty_networking_discover')
    return cached ? JSON.parse(cached) : []
  })
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const cached = sessionStorage.getItem('scotty_networking_appointments')
    return cached ? JSON.parse(cached) : []
  })

  // Profile edit state
  const [bio, setBio] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  // Selection state
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false)
  const [sessionError, setSessionError] = useState(false)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null)
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set())

  const [loading, setLoading] = useState(!sessionStorage.getItem('scotty_networking_discover'))
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
    fetchInitialData()
  }, [])

  function generateTimeSlots() {
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

  function getFutureDateStrings(daysAhead = 14) {
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

  function getDateLabel(dateString: string) {
    if (!dateString) return ''
    const d = new Date(dateString)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
  }

  function getBusyTimesForDate(dateString: string) {
    const dateLabel = getDateLabel(dateString)
    const times = new Set<string>()
    busySlots.forEach(slot => {
      const prefix = `${dateLabel} @ `
      if (slot.startsWith(prefix)) {
        times.add(slot.slice(prefix.length))
      }
    })
    return times
  }

  function buildScheduledAt(dateString: string, time: string): string {
    if (!dateString || !time) return ''
    // Keep local wall-clock time so booked and displayed times stay consistent.
    return `${dateString}T${convertTimeTo24Hour(time)}:00`
  }

  function convertTimeTo24Hour(time: string) {
    const [clock, period] = time.split(' ')
    let [hour, minute] = clock.split(':').map(Number)
    if (period === 'PM' && hour < 12) hour += 12
    if (period === 'AM' && hour === 12) hour = 0
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  function isTimePastInMV(dateString: string, timeString: string) {
    if (!dateString) return false
    
    // Get current Mountain View time safely
    const nowMV = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
    
    // Construct today's date string in MV time
    const year = nowMV.getFullYear()
    const month = String(nowMV.getMonth() + 1).padStart(2, '0')
    const day = String(nowMV.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`
    
    if (dateString !== todayStr) return false
    
    const time24 = convertTimeTo24Hour(timeString)
    const [hour, min] = time24.split(':').map(Number)
    
    if (hour < nowMV.getHours()) return true
    if (hour === nowMV.getHours() && min <= nowMV.getMinutes()) return true
    return false
  }

  async function openInviteModal(user: UserProfile) {
    const me = StorageUtil.getUser()
    if (!me) return

    setTargetUser(user)
    setSelectedDate('')
    setSelectedTime('')
    setTimeDropdownOpen(false)
    setIsModalOpen(true)

    try {
      // Fetch busy slots for both participants
      const [res1, res2] = await Promise.all([
        fetch(`/api/networking/busy-slots/${me.id}`, { headers: authHeaders() }),
        fetch(`/api/networking/busy-slots/${user.id}`, { headers: authHeaders() })
      ])
      const data1 = await res1.json()
      const data2 = await res2.json()

      const combinedBusy = new Set<string>([
        ...(data1.busy_slots || []),
        ...(data2.busy_slots || [])
      ])
      setBusySlots(combinedBusy)
    } catch (err) {
      console.error("Failed to fetch busy slots", err)
    }
  }

  async function fetchInitialData() {
    const user = StorageUtil.getUser()
    if (!user || !user.id || !user.username) {
      setSessionError(true)
      setLoading(false)
      return
    }

    try {
      // Execute fetches in parallel to reduce loading times
      const [res, apptRes] = await Promise.all([
        fetch('/api/accounts/discover'),
        fetch(`/api/networking/appointments/${user.id}`, { headers: authHeaders() })
      ])

      const data = await res.json()
      const allUsers: UserProfile[] = data.users || []

      // Filter out our own profile from discovery (Liskov/SRP compliance: data filtering)
      const filteredUsers = allUsers.filter(u => u.id !== user.id)
      setDiscoverUsers(filteredUsers)
      sessionStorage.setItem('scotty_networking_discover', JSON.stringify(filteredUsers))

      // Find ourselves in the list to populate the profile editor
      const me = allUsers.find(u => u.username === user.username)
      if (me) {
        setBio(me.bio || '')
        setTagsInput(me.tags ? me.tags.join(', ') : '')
      }

      // Handle appointments
      const apptData = await apptRes.json()
      const returnedAppointments = apptData.appointments || []
      setAppointments(returnedAppointments)
      sessionStorage.setItem('scotty_networking_appointments', JSON.stringify(returnedAppointments))

      setLoading(false)
    } catch (err) {
      console.error("Failed to fetch networking data", err)
      setLoading(false)
    }
  }

  async function handleUpdateProfile() {
    const user = StorageUtil.getUser()
    if (!user || !user.id) return

    try {
      const res = await fetch('/api/accounts/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          bio: bio,
          tags: tagsInput.split(',').map(t => t.trim()).filter(t => t)
        })
      })
      if (res.ok) {
        setMessage("Profile updated successfully!")
        setTimeout(() => setMessage(''), 3000)
        fetchInitialData()
      }
    } catch (err) {
      setMessage("Failed to update profile.")
    }
  }

  async function handleSendInvite() {
    const user = StorageUtil.getUser()
    if (!user || !user.id || !targetUser) return

    try {
      if (!selectedDate || !selectedTime) return

      const scheduled_at = buildScheduledAt(selectedDate, selectedTime)

      const res = await fetch('/api/networking/invite', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          receiver_id: targetUser.id,
          scheduled_at,
        })
      })
      const data = await res.json()
      if (res.ok) {
        const successMessage = "Invitation sent!"
        setMessage(successMessage)
        showAlertBox('success', successMessage)
        setIsModalOpen(false)
        fetchInitialData()
      } else {
        const isInviteCapError =
          typeof data.message === 'string' &&
          data.message.includes('at most 3 distinct alumni per day')
        const failureMessage = isInviteCapError
          ? "you have exceeded you invitation cap"
          : (data.message || "Failed to send invitation.")
        setMessage(failureMessage)
        showAlertBox('error', failureMessage)
      }
    } catch (err) {
      const errorMessage = "Error connecting to server."
      setMessage(errorMessage)
      showAlertBox('error', errorMessage)
    }
  }

  async function handleRespond(inviteId: string, accept: boolean) {
    const user = StorageUtil.getUser()
    if (!user) return

    try {
      const res = await fetch('/api/networking/respond', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          invite_id: inviteId,
          accept: accept
        })
      })
      if (res.ok) {
        const responseMessage = accept ? "Invitation accepted." : "Invitation declined."
        setMessage(responseMessage)
        showAlertBox('success', responseMessage)
        fetchInitialData()
      } else {
        const data = await res.json()
        const errorMessage = data.message || "Failed to respond to invitation."
        setMessage(errorMessage)
        showAlertBox('error', errorMessage)
      }
    } catch (err) {
      const errorMessage = "Error connecting to server."
      setMessage(errorMessage)
      showAlertBox('error', errorMessage)
    }
  }

  async function handleCancelInvite(inviteId: string) {
    const user = StorageUtil.getUser()
    if (!user || !user.id) return

    try {
      const res = await fetch('/api/networking/cancel', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({
          invite_id: inviteId
        })
      })
      const data = await res.json()
      if (res.ok) {
        const successMessage = "Invitation cancelled."
        setMessage(successMessage)
        showAlertBox('success', successMessage)
        fetchInitialData()
      } else {
        const errorMessage = data.message || "Failed to cancel."
        setMessage(errorMessage)
        showAlertBox('error', errorMessage)
      }
    } catch (err) {
      const errorMessage = "Error connecting to server."
      setMessage(errorMessage)
      showAlertBox('error', errorMessage)
    }
  }

  if (sessionError) return (
    <div className="networking-page">
      <div className="auth-error" style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Session Update Required</h2>
        <p>Your session is missing required security identifiers from the recent update.</p>
        <button
          className="book-btn"
          style={{ marginTop: '20px', width: 'auto', padding: '10px 24px' }}
          onClick={() => { StorageUtil.removeUser(); window.location.href = '/login'; }}
        >
          Log Out & Log In Again
        </button>
      </div>
    </div>
  )

  if (loading) return <div className="networking-page">Loading networking hub...</div>

  return (
    <div className="networking-page">
      {alertBox && (
        <div className={`networking-alertbox networking-alertbox--${alertBox.type}`} role="alert">
          <div className="networking-alertbox-body">
            <span className="networking-alertbox-icon">{alertBox.type === 'success' ? '✓' : '!'}</span>
            <span>{alertBox.text}</span>
          </div>
          <button
            className="networking-alertbox-close"
            onClick={() => setAlertBox(null)}
            aria-label="Close notification"
          >
            &times;
          </button>
        </div>
      )}
      <header className="networking-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Link to="/mainpage" className="tag-badge" style={{ textDecoration: 'none', padding: '8px 16px' }}>
            ← Back to Dashboard
          </Link>
          <Link
            to="/my-meetings"
            className="book-btn"
            style={{ width: 'auto', padding: '8px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            My Meetings
          </Link>
        </div>
        <h1>Networking Hub</h1>
        <p>Connect with peers and mentors across CMU-SV</p>
        {message && <div className="auth-success" style={{ marginTop: '20px' }}>{message}</div>}
      </header>

      {/* 1. Profile Setup Section */}
      <section className="profile-card">
        <h2>{StorageUtil.getUser()?.username}'s Networking Blueprint</h2>
        <div className="profile-form">
          <div className="profile-form-group">
            <label>Professional Bio</label>
            <textarea
              placeholder="Tell others what you're working on..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          </div>
          <div className="profile-form-group">
            <label>Interest Tags (comma separated)</label>
            <textarea
              placeholder="e.g. AI, Product Management, Startup"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              rows={3}
            />
            <button
              className="book-btn"
              onClick={handleUpdateProfile}
              style={{ marginTop: '12px' }}
            >
              Update Profile
            </button>
          </div>
        </div>
      </section>

      {/* 3. Discovery Section */}
      <section className="discover-section">
        <h2>Discover People</h2>
        <div className="discover-grid">
          {discoverUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <div className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h3>{user.username}</h3>
                  <span className="user-role-badge">{user.role}</span>
                </div>
              </div>
              <p className="user-bio">{user.bio || "No bio yet."}</p>
              <div className="user-tags">
                {(user.tags || []).map(tag => (
                  <span key={tag} className="tag-badge">{tag}</span>
                ))}
              </div>

              <div className="user-card-footer">
                <button
                  className="book-btn"
                  onClick={() => openInviteModal(user)}
                >
                  Propose Coffee Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* 4. Scheduling Modal */}
      {isModalOpen && targetUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Propose Coffee Chat with {targetUser.username}</h2>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="date-time-picker">
                <label htmlFor="date-select">Choose a date</label>
                <input
                  id="date-select"
                  type="date"
                  min={getFutureDateStrings(1)[0]}
                  max={getFutureDateStrings(14)[13]}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedTime('')
                    setTimeDropdownOpen(false)
                  }}
                />
              </div>

              <div className="date-time-picker">
                <label>Choose a time</label>
                <button
                  type="button"
                  className={`time-dropdown-button ${!selectedDate ? 'disabled' : ''}`}
                  onClick={() => setTimeDropdownOpen(prev => !prev)}
                  disabled={!selectedDate}
                >
                  {selectedTime || 'Select a time'}
                  <span className="dropdown-arrow">▾</span>
                </button>
                {timeDropdownOpen && selectedDate && (
                  <div className="time-dropdown-menu">
                    {generateTimeSlots().map(time => {
                      const busyTimes = getBusyTimesForDate(selectedDate)
                      const isTimePast = isTimePastInMV(selectedDate, time)
                      const isBusy = busyTimes.has(time) || isTimePast
                      const selected = selectedTime === time
                      return (
                        <button
                          key={time}
                          type="button"
                          className={`time-dropdown-item ${selected ? 'selected' : ''} ${isBusy ? 'busy' : ''}`}
                          onClick={() => {
                            if (!isBusy) {
                              setSelectedTime(time)
                              setTimeDropdownOpen(false)
                            }
                          }}
                          disabled={isBusy}
                        >
                          {time}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button
                className="book-btn"
                style={{ width: 'auto', padding: '10px 32px' }}
                disabled={!selectedDate || !selectedTime}
                onClick={handleSendInvite}
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
