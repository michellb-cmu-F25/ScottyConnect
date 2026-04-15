import './FeedbackDirection.css'

export interface FeedbackDirectionProps {
  onBack: () => void
  onOpenSubmission: () => void
  onOpenHistory: () => void
  onOpenStats: () => void
}

function FeedbackDirection({
  onBack,
  onOpenSubmission,
  onOpenHistory,
  onOpenStats,
}: FeedbackDirectionProps) {
  return (
    <div className="feedback-direction-page">
      <div className="feedback-direction-container">
        <h1 className="feedback-direction-title">Feedback Portal</h1>
        <p className="feedback-direction-subtitle">
          Select a feedback-related page to preview.
        </p>

        <div className="feedback-direction-list">
          <button
            className="feedback-direction-card"
            onClick={onOpenSubmission}
          >
            <h2>Feedback Submission Page</h2>
            <p>Preview the page where a user submits feedback.</p>
          </button>

          <button
            className="feedback-direction-card"
            onClick={onOpenHistory}
          >
            <h2>Feedback History Page</h2>
            <p>Preview past feedback submissions.</p>
          </button>

          <button
            className="feedback-direction-card"
            onClick={onOpenStats}
          >
            <h2>Feedback Stats</h2>
            <p>Preview event feedback overview and aggregate ratings.</p>
          </button>

          <div className="feedback-direction-card feedback-direction-card-disabled">
            <h2>Feedback Details Page</h2>
            <p>Placeholder for future development.</p>
          </div>
        </div>

        <div className="feedback-direction-actions">
          <button className="feedback-back-button" onClick={onBack}>
            Back to Starter Page
          </button>
        </div>
      </div>
    </div>
  )
}

export default FeedbackDirection