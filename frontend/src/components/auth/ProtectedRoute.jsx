import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

/**
 * Protected pages. Short bootstrap wait only — never hang forever.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [bootDone, setBootDone] = useState(!loading);

  useEffect(() => {
    if (!loading) {
      setBootDone(true);
      return undefined;
    }

    const timer = window.setTimeout(() => setBootDone(true), 1500);
    return () => window.clearTimeout(timer);
  }, [loading]);

  if (!bootDone) {
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
