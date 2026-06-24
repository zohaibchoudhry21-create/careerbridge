import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function GuestRoute({ children }) {
  const { isAuthenticated, loading, syncSession } = useAuth();
  const hasSyncedSession = useRef(false);

  useEffect(() => {
    if (loading || isAuthenticated || hasSyncedSession.current) {
      return;
    }

    hasSyncedSession.current = true;
    syncSession({ preserveExistingSession: true });
  }, [isAuthenticated, loading, syncSession]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
