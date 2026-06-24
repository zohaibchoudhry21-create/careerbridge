import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, syncSession } = useAuth();
  const location = useLocation();
  const [sessionChecked, setSessionChecked] = useState(false);
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (isAuthenticated) {
      setSessionChecked(true);
      return;
    }

    if (syncAttempted.current) {
      return;
    }

    syncAttempted.current = true;

    (async () => {
      await syncSession({ preserveExistingSession: false });
      setSessionChecked(true);
    })();
  }, [loading, isAuthenticated, syncSession]);

  if (loading || !sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
