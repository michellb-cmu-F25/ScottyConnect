import './FeedbackStats.css'

type FeedbackStatsProps = {
  onBack: () => void
}

type EventFeedbackItem = {
  id: number
  userName: string
  rating: number
  feedbackText: string
  submittedAt: string
}

function FeedbackStats({ onBack }: FeedbackStatsProps) {
  const eventName = 'Spring Networking Mixer'
  const eventTime = 'April 10, 2026, 6:00 PM - 8:00 PM'
  const averageRating = 4.3

  const feedbackList: EventFeedbackItem[] = [
    {
      id: 1,
      userName: 'John Doe',
      rating: 5,
      feedbackText:
        'The event was very well organized and the atmosphere was welcoming. I had several meaningful conversations and enjoyed the overall experience.',
      submittedAt: 'April 10, 2026, 8:15 PM',
    },
    {
      id: 2,
      userName: 'Emily Chen',
      rating: 4,
      feedbackText:
        'Great event overall. The networking opportunities were valuable, though I think a bit more time for the Q&A section would have made it even better.',
      submittedAt: 'April 10, 2026, 8:27 PM',
    },
    {
      id: 3,
      userName: 'Michael Lee',
      rating: 4,
      feedbackText:
        'I liked the structure of the event and thought the pacing was good. The venue was also comfortable and easy to navigate.',
      submittedAt: 'April 10, 2026, 8:41 PM',
    },
    {
      id: 4,
      userName: 'Sarah Kim',
      rating: 4,
      feedbackText:
        'The event content was useful and relevant. I especially appreciated how approachable the organizers were throughout the session.',
      submittedAt: 'April 10, 2026, 9:02 PM',
    },
  ]

  return (
    <div className="event-feedback-page">
      <div className="event-feedback-container">
        <div className="event-feedback-top-bar">
          <button type="button" className="event-feedback-back-button" onClick={onBack}>
            Back to Feedback Portal
          </button>
        </div>

        <h1 className="event-feedback-title">Event Feedback Overview</h1>

        <section className="event-feedback-summary">
          <div className="event-feedback-row">
            <span className="event-feedback-label">Event Name:</span>
            <span>{eventName}</span>
          </div>

          <div className="event-feedback-row">
            <span className="event-feedback-label">Event Time:</span>
            <span>{eventTime}</span>
          </div>

          <div className="event-feedback-row">
            <span className="event-feedback-label">Average Rating:</span>
            <span>{averageRating} / 5</span>
          </div>
        </section>

        <section className="event-feedback-list-section">
          <h2 className="event-feedback-section-title">Submitted Feedback</h2>

          <div className="event-feedback-list">
            {feedbackList.map((item) => (
              <div key={item.id} className="event-feedback-card">
                <div className="event-feedback-row">
                  <span className="event-feedback-label">User:</span>
                  <span>{item.userName}</span>
                </div>

                <div className="event-feedback-row">
                  <span className="event-feedback-label">Rating:</span>
                  <span>{item.rating} / 5</span>
                </div>

                <div className="event-feedback-text-block">
                  <span className="event-feedback-label">Feedback:</span>
                  <p className="event-feedback-text">{item.feedbackText}</p>
                </div>

                <div className="event-feedback-row">
                  <span className="event-feedback-label">Submitted At:</span>
                  <span>{item.submittedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default FeedbackStats