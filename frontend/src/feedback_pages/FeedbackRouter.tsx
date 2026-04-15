import FeedbackDirection, {
  type FeedbackDirectionProps,
} from './FeedbackDirection'
import FeedbackHistory from './FeedbackHistory'
import FeedbackStats from './FeedbackStats'
import FeedbackSubmission from './FeedbackSubmission'

export type FeedbackView =
  | 'feedbackDirection'
  | 'feedbackSubmission'
  | 'feedbackHistory'
  | 'feedbackStats'

export function isFeedbackView(view: string): view is FeedbackView {
  return (
    view === 'feedbackDirection' ||
    view === 'feedbackSubmission' ||
    view === 'feedbackHistory' ||
    view === 'feedbackStats'
  )
}

type FeedbackRouterProps = {
  view: FeedbackView
  setView: (view: string) => void
}

export function FeedbackRouter({ view, setView }: FeedbackRouterProps) {
  const toPortal = () => setView('feedbackDirection')

  switch (view) {
    case 'feedbackDirection': {
      const directionProps: FeedbackDirectionProps = {
        onBack: () => setView('home'),
        onOpenSubmission: () => setView('feedbackSubmission'),
        onOpenHistory: () => setView('feedbackHistory'),
        onOpenStats: () => setView('feedbackStats'),
      }
      return <FeedbackDirection {...directionProps} />
    }
    case 'feedbackSubmission':
      return <FeedbackSubmission onBack={toPortal} />
    case 'feedbackHistory':
      return <FeedbackHistory onBack={toPortal} />
    case 'feedbackStats':
      return <FeedbackStats onBack={toPortal} />
  }
}
