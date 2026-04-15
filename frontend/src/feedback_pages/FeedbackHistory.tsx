import './FeedbackHistory.css'

type FeedbackHistoryProps = {
  onBack: () => void
}

function FeedbackHistory({ onBack }: FeedbackHistoryProps) {
  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <div className="feedback-top-bar">
          <button className="feedback-back-button" onClick={onBack}>
            Back to Feedback Portal
          </button>
        </div>

        <h1 className="feedback-title">Feedback History</h1>

        <section className="feedback-section">
          <h2 className="feedback-section-title">Past submissions</h2>
          <ul className="feedback-history-list">
            <li className="feedback-history-item">
              <div className="feedback-history-item-header">
                <p className="feedback-history-event">Spring Networking Mixer</p>
                <p className="feedback-history-date">April 10, 2026</p>
              </div>
              <p className="feedback-history-rating">Rating: 5 / 5</p>
              <p className="feedback-history-snippet">
                Great event — will attend again.
              </p>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

export default FeedbackHistory
