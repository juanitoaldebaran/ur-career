import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import ConditionalNavbar from './components/ConditionalNavbar'
import RootPage from './pages/RootPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ConsultationPage from './pages/ConsultationPage'
import CvBuilderPage from './pages/CvBuilderPage'
import RoadmapsPage from './pages/RoadmapsPage'
import RoadmapDetailPage from './pages/RoadmapDetailPage'
import PracticePage from './pages/PracticePage'

function App() {
  return (
    <AuthProvider>
      <ConditionalNavbar />
      <Routes>
        <Route path="/" element={<RootPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/consultation" element={<ConsultationPage />} />
          <Route path="/cv-builder" element={<CvBuilderPage />} />
          <Route path="/roadmap" element={<RoadmapsPage />} />
          <Route path="/roadmap/:slug" element={<RoadmapDetailPage />} />
          <Route path="/practice" element={<PracticePage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App
