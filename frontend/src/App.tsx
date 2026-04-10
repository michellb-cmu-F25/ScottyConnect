import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerificationPage from './pages/VerificationPage'
import MainPage from './pages/MainPage'
import NetworkingPage from './pages/NetworkingPage'
import PlaceholderPage from './pages/PlaceholderPage'
import CreateEventPage from './pages/CreateEventPage'
import MyEventsPage from './pages/MyEventsPage'
import EventConfirmationPage from './pages/EventConfirmationPage'
import EditEventPage from './pages/EditEventPage'
import TaskBoardPage from './pages/TaskBoardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/mainpage" element={<MainPage />} />
        <Route path="/networking" element={<NetworkingPage />} />
        <Route path="/feedback" element={<PlaceholderPage title="Feedback" />} />
        <Route path="/publish-event" element={<CreateEventPage />} />
        <Route path="/attendance" element={<PlaceholderPage title="Attendance" />} />
        <Route path="/my-events" element={<MyEventsPage />} />
        <Route path="/events/:id/edit" element={<EditEventPage />} />
        <Route path="/events/:eventId/tasks" element={<TaskBoardPage />} />
        <Route path="/event-published" element={<EventConfirmationPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
