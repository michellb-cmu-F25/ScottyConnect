import './FeedbackSubmission.css'

type FeedbackSubmissionProps = {
  onBack: () => void
}

function FeedbackSubmission({ onBack }: FeedbackSubmissionProps) {
  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <div className="feedback-top-bar">
          <button className="feedback-back-button" onClick={onBack}>
            Back to Feedback Portal
          </button>
        </div>

        <h1 className="feedback-title">Submit Feedback</h1>

        <section className="feedback-section">
          <h2 className="feedback-section-title">Basic Information</h2>
          <div className="feedback-info-row">
            <span className="feedback-label">User Name:</span>
            <span>John Doe</span>
          </div>
          <div className="feedback-info-row">
            <span className="feedback-label">Event Name:</span>
            <span>Spring Networking Mixer</span>
          </div>
          <div className="feedback-info-row">
            <span className="feedback-label">Time:</span>
            <span>April 10, 2026, 6:00 PM - 8:00 PM</span>
          </div>
          <div className="feedback-info-row">
            <span className="feedback-label">Organizer:</span>
            <span>CMU Student Events Team</span>
          </div>
        </section>

        <section className="feedback-section">
          <h2 className="feedback-section-title">Your Feedback</h2>

          <form className="feedback-form">
            <div className="feedback-form-group">
              <label htmlFor="rating">Rating (1 to 5)</label>
              <select id="rating" name="rating" required>
                <option value="">Select a rating</option>
                <option value="1">1 - Very Poor</option>
                <option value="2">2 - Poor</option>
                <option value="3">3 - Average</option>
                <option value="4">4 - Good</option>
                <option value="5">5 - Excellent</option>
              </select>
            </div>

            <div className="feedback-form-group">
              <label htmlFor="feedback">Feedback</label>
              <textarea
                id="feedback"
                name="feedback"
                maxLength={1000}
                placeholder="Write your feedback here..."
                rows={8}
                required
              />
              <p className="feedback-help-text">Maximum 1000 characters</p>
            </div>

            <button type="submit" className="feedback-submit-button">
              Submit Feedback
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default FeedbackSubmission