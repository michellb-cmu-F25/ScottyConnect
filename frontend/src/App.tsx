import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './common/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerificationPage from './pages/VerificationPage'
import MainPage from './pages/MainPage'
import NetworkingPage from './pages/NetworkingPage'
import CreateEventPage from './pages/CreateEventPage'
import MyEventsPage from './pages/MyEventsPage'
import EventConfirmationPage from './pages/EventConfirmationPage'
import EditEventPage from './pages/EditEventPage'
import TaskBoardPage from './pages/TaskBoardPage'
import FeedbackHistoryPage from './pages/FeedbackHistoryPage'
import MyMeetingsPage from './pages/MyMeetingsPage'
import EventDetailPage from './pages/EventDetailPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/pages/login" element={<LoginPage />} />
        <Route path="/pages/register" element={<RegisterPage />} />
        <Route path="/pages/verify" element={<VerificationPage />} />
        <Route path="/pages/mainpage" element={
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        } />
        <Route path="/pages/networking" element={
          <ProtectedRoute>
            <NetworkingPage />
          </ProtectedRoute>
        } />
        <Route path="/pages/my-meetings" element={
          <ProtectedRoute>
            <MyMeetingsPage />
          </ProtectedRoute>
        } />
        <Route path="/pages/feedback" element={
            <ProtectedRoute>
            <FeedbackHistoryPage />
          </ProtectedRoute>
        } />
        <Route
          path="/pages/publish-event"
          element={
            <ProtectedRoute>
              <CreateEventPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pages/my-events"
          element={
            <ProtectedRoute>
              <MyEventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pages/events/:id"
          element={
            <ProtectedRoute>
              <EventDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pages/events/:id/edit"
          element={
            <ProtectedRoute>
              <EditEventPage />
            </ProtectedRoute>
          }
        />
        <Route path="/pages/events/:eventId/tasks" element={
          <ProtectedRoute>
            <TaskBoardPage />
          </ProtectedRoute>
        } />
        <Route path="/pages/event-published" element={
          <ProtectedRoute>
            <EventConfirmationPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/pages/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
