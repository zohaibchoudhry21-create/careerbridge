import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  getMe,
  loginUser,
  logoutUser,
  setAuthToken,
} from '../services/authService';
import { clearStoredToken } from '../utils/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const authGenerationRef = useRef(0);

  const restoreSession = useCallback(async () => {
    const generation = authGenerationRef.current;
    clearStoredToken();
    setAuthToken(null);

    try {
      const { data } = await getMe();
      if (generation !== authGenerationRef.current) return;
      setUser(data.user);
      setSessionActive(true);
    } catch {
      if (generation !== authGenerationRef.current) return;
      setUser(null);
      setSessionActive(false);
    } finally {
      if (generation === authGenerationRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const syncSession = useCallback(async ({ preserveExistingSession = false } = {}) => {
    const generation = authGenerationRef.current;

    try {
      const { data } = await getMe();
      if (generation !== authGenerationRef.current) return data.user;
      setUser(data.user);
      setSessionActive(true);
      setLoading(false);
      return data.user;
    } catch {
      if (generation !== authGenerationRef.current) return null;
      if (!preserveExistingSession) {
        setUser(null);
        setSessionActive(false);
      }
      return null;
    }
  }, []);

  const handleAuthSuccess = useCallback((data) => {
    authGenerationRef.current += 1;
    clearStoredToken();

    if (data?.token) {
      setAuthToken(data.token);
    } else {
      setAuthToken(null);
    }

    setUser(data?.user ?? null);
    setSessionActive(Boolean(data?.user));
    setLoading(false);
    return data;
  }, []);

  const updateUser = useCallback((partialUser) => {
    setUser((currentUser) => (currentUser ? { ...currentUser, ...partialUser } : currentUser));
  }, []);

  const login = useCallback(async (credentials, remember = true) => {
    const { data } = await loginUser({ ...credentials, remember });
    return handleAuthSuccess(data);
  }, [handleAuthSuccess]);

  const logout = useCallback(async () => {
    if (sessionActive) {
      await logoutUser();
    }

    clearStoredToken();
    setAuthToken(null);
    setSessionActive(false);
    setUser(null);
  }, [sessionActive]);

  const value = useMemo(
    () => ({
      user,
      token: sessionActive ? 'session' : null,
      loading,
      isAuthenticated: Boolean(user && sessionActive),
      login,
      logout,
      setSession: handleAuthSuccess,
      syncSession,
      updateUser,
    }),
    [user, sessionActive, loading, login, logout, handleAuthSuccess, syncSession, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};
