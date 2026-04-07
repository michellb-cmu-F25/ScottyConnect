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
  receiver_id: string
  timeslot: string
  status: string
  created_at: string
}

export default function NetworkingPage() {
  const [discoverUsers, setDiscoverUsers] = useState<UserProfile[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  
  // Profile edit state
  const [bio, setBio] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    const user = StorageUtil.getUser()
    if (!user || !user.id || !user.username) return

    try {
      // Fetch all users for discovery
      const res = await fetch('/api/accounts/discover')
      const data = await res.json()
      const allUsers: UserProfile[] = data.users || []
      setDiscoverUsers(allUsers)

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

  async function handleSendInvite(targetUserId: string) {
    const user = StorageUtil.getUser()
    if (!user || !user.id) return

    try {
      const res = await fetch('/api/networking/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_id: targetUserId,
          timeslot: "2:00 PM (Tomorrow)" // Simplified for demo
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMessage("Invitation sent!")
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
          responder_id: user.username,
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
        <h2>Your Networking Blueprint</h2>
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
            appointments.map(appt => (
              <div key={appt.id} className="chat-item">
                <div className="chat-info">
                  <span className="user-role-badge">Time: {appt.timeslot}</span>
                  <p style={{margin: '8px 0 0', fontWeight: 600}}>
                    {appt.sender_id === StorageUtil.getUser()?.username ? `Outing to ${appt.receiver_id}` : `Incoming from ${appt.sender_id}`}
                  </p>
                </div>
                <div className="chat-actions">
                  <span className={`chat-status-badge status-${appt.status.toLowerCase()}`}>
                    {appt.status}
                  </span>
                  {appt.status === 'PENDING' && appt.receiver_id === StorageUtil.getUser()?.username && (
                    <div style={{display: 'inline-flex', gap: '8px', marginLeft: '12px'}}>
                      <button onClick={() => handleRespond(appt.id, true)} className="tag-badge" style={{cursor: 'pointer', background: '#dcfce7'}}>Accept</button>
                      <button onClick={() => handleRespond(appt.id, false)} className="tag-badge" style={{cursor: 'pointer', background: '#fee2e2'}}>Decline</button>
                    </div>
                  )}
                </div>
              </div>
            ))
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
              <button 
                className="book-btn"
                onClick={() => handleSendInvite(user.username)}
              >
                Propose Coffee Chat
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
