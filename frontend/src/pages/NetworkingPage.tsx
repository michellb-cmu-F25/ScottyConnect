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
  timeslot: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'COMPLETED'
  created_at: string
}

export default function NetworkingPage() {
  const [discoverUsers, setDiscoverUsers] = useState<UserProfile[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  
  // Profile edit state
  const [bio, setBio] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  
  // Selection state
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [sessionError, setSessionError] = useState(false)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null)
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set())
  
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

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

  function getFutureDates() {
    const dates = []
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    for (let i = 0; i < 5; i++) {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const label = `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
      dates.push(label)
    }
    return dates
  }

  async function openInviteModal(user: UserProfile) {
    const me = StorageUtil.getUser()
    if (!me) return

    setTargetUser(user)
    setSelectedDate('')
    setSelectedTime('')
    setIsModalOpen(true)

    try {
      // Fetch busy slots for both participants
      const [res1, res2] = await Promise.all([
        fetch(`/api/networking/busy-slots/${me.id}`),
        fetch(`/api/networking/busy-slots/${user.id}`)
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
      // Fetch all users for discovery
      const res = await fetch('/api/accounts/discover')
      const data = await res.json()
      const allUsers: UserProfile[] = data.users || []
      
      // Filter out our own profile from discovery (Liskov/SRP compliance: data filtering)
      setDiscoverUsers(allUsers.filter(u => u.id !== user.id))

      // Find ourselves in the list to populate the profile editor
      const me = allUsers.find(u => u.username === user.username)
      if (me) {
        setBio(me.bio || '')
        setTagsInput(me.tags ? me.tags.join(', ') : '')
      }

      // Fetch my appointments
      const apptRes = await fetch(`/api/networking/appointments/${user.id}`)
      const apptData = await apptRes.json()
      setAppointments(apptData.appointments || [])
      
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

      const timeslot = `${selectedDate} @ ${selectedTime}`

      const res = await fetch('/api/networking/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: targetUser.id,
          timeslot: timeslot
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage("Invitation sent!")
        setIsModalOpen(false)
        fetchInitialData()
      } else {
        setMessage(data.message || "Failed to send invitation.")
      }
    } catch (err) {
      setMessage("Error connecting to server.")
    }
  }

  async function handleRespond(inviteId: string, accept: boolean) {
    const user = StorageUtil.getUser()
    if (!user) return

    try {
      const res = await fetch('/api/networking/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_id: inviteId,
          responder_id: user.id,
          accept: accept
        })
      })
      if (res.ok) {
        fetchInitialData()
      }
    } catch (err) {
       console.error("Failed to respond", err)
    }
  }

  async function handleCancelInvite(inviteId: string) {
    const user = StorageUtil.getUser()
    if (!user || !user.id) return

    try {
      const res = await fetch('/api/networking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invite_id: inviteId,
          sender_id: user.id
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage("Invitation cancelled.")
        fetchInitialData()
      } else {
        setMessage(data.message || "Failed to cancel.")
      }
    } catch (err) {
      setMessage("Error connecting to server.")
    }
  }

  if (sessionError) return (
    <div className="networking-page">
       <div className="auth-error" style={{textAlign: 'center', padding: '40px'}}>
          <h2>Session Update Required</h2>
          <p>Your session is missing required security identifiers from the recent update.</p>
          <button 
            className="book-btn" 
            style={{marginTop: '20px', width: 'auto', padding: '10px 24px'}}
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
      <header className="networking-header">
        <div style={{ textAlign: 'left', marginBottom: '16px' }}>
          <Link to="/mainpage" className="tag-badge" style={{ textDecoration: 'none', padding: '8px 16px' }}>
            ← Back to Dashboard
          </Link>
        </div>
        <h1>Networking Hub</h1>
        <p>Connect with peers and mentors across CMU-SV</p>
        {message && <div className="auth-success" style={{marginTop: '20px'}}>{message}</div>}
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
              style={{marginTop: '12px'}}
            >
              Update Profile
            </button>
          </div>
        </div>
      </section>

      {/* 2. Dashboard Section */}
      <section className="chats-section">
        <h2>My Coffee Chats</h2>
        <div className="chats-grid">
          {appointments.length === 0 ? (
            <p className="main-section-desc">No active chats yet. Start by inviting someone below!</p>
          ) : (
            appointments.map(appt => {
              const user = StorageUtil.getUser()
              const isSender = appt.sender_id === user?.id
              const otherName = isSender ? appt.receiver_name : appt.sender_name
              
              return (
                <div key={appt.id} className="chat-item">
                  <div className="chat-info">
                    <span className="chat-type-label">
                      {isSender ? "📤 Outgoing to" : "📥 Incoming from"}
                    </span>
                    <h3 className="chat-partner-name">{otherName || "Unknown User"}</h3>
                    <p className="chat-time">🕒 {appt.timeslot}</p>
                  </div>
                  
                  <div className="chat-actions">
                    <span className={`chat-status-badge status-${appt.status.toLowerCase()}`}>
                      {appt.status}
                    </span>
                    
                    {appt.status === 'PENDING' && (
                      <div className="action-buttons">
                        {isSender ? (
                          <button 
                            className="cancel-btn"
                            onClick={() => handleCancelInvite(appt.id)}
                          >
                            Cancel
                          </button>
                        ) : (
                          <>
                            <button 
                              className="accept-btn"
                              onClick={() => handleRespond(appt.id, true)}
                            >
                              Accept
                            </button>
                            <button 
                              className="decline-btn"
                              onClick={() => handleRespond(appt.id, false)}
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
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
              <div className="calendar-grid">
                {getFutureDates().map(date => (
                  <div key={date} className="day-section">
                    <h4 className="day-title">{date}</h4>
                    <div className="time-slots-grid">
                      {generateTimeSlots().map(time => {
                        const slotKey = `${date} @ ${time}`
                        const isBusy = busySlots.has(slotKey)
                        const isSelected = selectedDate === date && selectedTime === time
                        
                        return (
                          <div 
                            key={time}
                            className={`time-slot-tile ${isBusy ? 'busy' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              if (!isBusy) {
                                setSelectedDate(date)
                                setSelectedTime(time)
                              }
                            }}
                          >
                            {time}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button 
                className="book-btn" 
                style={{width: 'auto', padding: '10px 32px'}}
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
