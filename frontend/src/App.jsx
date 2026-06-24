import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailSent from './pages/VerifyEmailSent';
import SocialAuthCallback from './pages/SocialAuthCallback';
import Dashboard from './pages/Dashboard';
import ProfileLayout from './pages/Profile/ProfileLayout';
import ProfileOverview from './pages/Profile/ProfileOverview';
import TemplateSelectionPage from './pages/ResumeBuilder/TemplateSelectionPage';
import ResumeEditorPage from './pages/ResumeBuilder/ResumeEditorPage';
import HeroResumeCapture from './pages/dev/HeroResumeCapture';
import GuestRoute from './components/auth/GuestRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dev/hero-resume-capture" element={<HeroResumeCapture />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <GuestRoute>
            <VerifyEmail />
          </GuestRoute>
        }
      />
      <Route
        path="/verify-email-sent"
        element={
          <GuestRoute>
            <VerifyEmailSent />
          </GuestRoute>
        }
      />
      <Route path="/auth/social/callback" element={<SocialAuthCallback />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/templates"
        element={
          <ProtectedRoute>
            <TemplateSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/editor/:resumeId"
        element={
          <ProtectedRoute>
            <ResumeEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProfileOverview />} />
      </Route>
    </Routes>
  );
}

export default App;
