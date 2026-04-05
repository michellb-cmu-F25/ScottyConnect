import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerificationPage from './pages/VerificationPage'
import MainPage from './pages/MainPage'
import PlaceholderPage from './pages/PlaceholderPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerificationPage />} />
        <Route path="/mainpage" element={<MainPage />} />
        <Route path="/networking" element={<PlaceholderPage title="Networking" />} />
        <Route path="/feedback" element={<PlaceholderPage title="Feedback" />} />
        <Route path="/publish-event" element={<PlaceholderPage title="Publish new event" />} />
        <Route path="/attendance" element={<PlaceholderPage title="Attendance" />} />
        <Route path="/my-events" element={<PlaceholderPage title="My events" />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
