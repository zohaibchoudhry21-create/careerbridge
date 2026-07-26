import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

/**
 * Guest-only pages. Never show a blocking spinner —
 * render login/register immediately; bounce away only if already signed in.
 */
export default function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // While auth is still booting, prefer showing the guest page over an infinite spinner.
  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
