import { createContext, useContext, useMemo } from 'react';
import { useMediaPermissions } from '../hooks/useMediaPermissions';

const InterviewMediaContext = createContext(null);

export function InterviewMediaProvider({ children }) {
  const {
    status,
    error,
    permissionIssue,
    stream,
    requestAccess,
    stopStream,
  } = useMediaPermissions();

  const value = useMemo(
    () => ({
      status,
      error,
      permissionIssue,
      stream,
      requestAccess,
      stopStream,
    }),
    [status, error, permissionIssue, stream, requestAccess, stopStream]
  );

  return (
    <InterviewMediaContext.Provider value={value}>{children}</InterviewMediaContext.Provider>
  );
}

export function useInterviewMedia() {
  const context = useContext(InterviewMediaContext);
  if (!context) {
    throw new Error('useInterviewMedia must be used within InterviewMediaProvider');
  }
  return context;
}
