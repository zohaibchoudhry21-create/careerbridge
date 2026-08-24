import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailSent from './pages/VerifyEmailSent';
import SocialAuthCallback from './pages/SocialAuthCallback';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings/Settings';
import PersonalInformation from './pages/Settings/PersonalInformation';
import LoginSecurity from './pages/Settings/LoginSecurity';
import AppearanceSettings from './pages/Settings/AppearanceSettings';
import AccountManagement from './pages/Settings/AccountManagement';
import InterviewPrepPage from './pages/InterviewPrep/InterviewPrepPage';
import SkillAssessmentSetupPage from './pages/InterviewPrep/SkillAssessmentSetupPage';
import MockInterviewLayout from './pages/InterviewPrep/MockInterviewLayout';
import MockInterviewSetupPage from './pages/InterviewPrep/MockInterviewSetupPage';
import MockInterviewHistoryPage from './pages/InterviewPrep/MockInterviewHistoryPage';
import MockInterviewSessionPage from './pages/InterviewPrep/MockInterviewSessionPage';
import PanelInterviewSetupPage from './pages/InterviewPrep/PanelInterviewSetupPage';
import PanelInterviewHistoryPage from './pages/InterviewPrep/PanelInterviewHistoryPage';
import SkillAssessmentQuizPage from './pages/InterviewPrep/SkillAssessmentQuizPage';
import { INTERVIEW_FORMATS } from './features/interviewPrep/constants/interviewPrepConstants';
import UploadResumePage from './pages/ResumeBuilder/UploadResumePage';
import ResumeEditorPage from './pages/ResumeBuilder/ResumeEditorPage';
import ResumeHistoryPage from './pages/ResumeBuilder/ResumeHistoryPage';
import ResumeDetailsPage from './pages/ResumeBuilder/ResumeDetailsPage';
import ResumeScannerUploadPage from './pages/ResumeScanner/ResumeScannerUploadPage';
import ResumeScannerAnalysisPage from './pages/ResumeScanner/ResumeScannerAnalysisPage';
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
        path="/interview-prep"
        element={
          <ProtectedRoute>
            <InterviewPrepPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview-prep/skills"
        element={
          <ProtectedRoute>
            <SkillAssessmentSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview-prep/mock"
        element={
          <ProtectedRoute>
            <MockInterviewLayout
              interviewFormat={INTERVIEW_FORMATS.STANDARD}
              basePath="/interview-prep/mock"
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<MockInterviewSetupPage />} />
        <Route path="history" element={<MockInterviewHistoryPage />} />
        <Route path=":sessionId" element={<MockInterviewSessionPage />} />
      </Route>
      <Route
        path="/interview-prep/panel"
        element={
          <ProtectedRoute>
            <MockInterviewLayout
              interviewFormat={INTERVIEW_FORMATS.PANEL}
              basePath="/interview-prep/panel"
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<PanelInterviewSetupPage />} />
        <Route path="history" element={<PanelInterviewHistoryPage />} />
        <Route path=":sessionId" element={<MockInterviewSessionPage />} />
      </Route>
      <Route
        path="/interview-prep/skills/:quizId"
        element={
          <ProtectedRoute>
            <SkillAssessmentQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/upload"
        element={
          <ProtectedRoute>
            <UploadResumePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/history"
        element={
          <ProtectedRoute>
            <ResumeHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/templates"
        element={
          <ProtectedRoute>
            <Navigate to="/resume/upload" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/scanner"
        element={
          <ProtectedRoute>
            <ResumeScannerUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-scanner"
        element={
          <ProtectedRoute>
            <ResumeScannerUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-scanner/:analysisId"
        element={
          <ProtectedRoute>
            <ResumeScannerAnalysisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/:id/edit"
        element={
          <ProtectedRoute>
            <ResumeEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/:id"
        element={
          <ProtectedRoute>
            <ResumeDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/personal-information"
        element={
          <ProtectedRoute>
            <PersonalInformation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/login-security"
        element={
          <ProtectedRoute>
            <LoginSecurity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/privacy"
        element={
          <ProtectedRoute>
            <Navigate to="/settings" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/appearance"
        element={
          <ProtectedRoute>
            <AppearanceSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/notifications"
        element={
          <ProtectedRoute>
            <Navigate to="/settings" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/account-management"
        element={
          <ProtectedRoute>
            <AccountManagement />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
