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
  verifyTwoFactorLogin,
  confirmAccountReactivation,
  cancelAccountReactivation,
} from '../services/authService';
import { clearStoredToken } from '../utils/tokenStorage';
import { syncLanguageWithUser } from '../i18n/syncLanguage';

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
    } catch (error) {
      if (generation !== authGenerationRef.current) return;
      const status = error?.response?.status;
      if (status === 429) {
        setLoading(false);
        return;
      }
      setUser(null);
      setSessionActive(false);
    } finally {
      if (generation === authGenerationRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const restoreStartedRef = useRef(false);

  useEffect(() => {
    if (restoreStartedRef.current) return;
    restoreStartedRef.current = true;
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    syncLanguageWithUser(user?.languagePreference);
  }, [user?.languagePreference]);

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
    // Prefer httpOnly cookie session — do not keep JWTs from API JSON responses.
    setAuthToken(null);

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
    if (data?.requires2FA) {
      return { requires2FA: true };
    }
    if (data?.requiresReactivation) {
      return { requiresReactivation: true };
    }
    return handleAuthSuccess(data);
  }, [handleAuthSuccess]);

  const verifyTwoFactor = useCallback(async (payload) => {
    const { data } = await verifyTwoFactorLogin(payload);
    return handleAuthSuccess(data);
  }, [handleAuthSuccess]);

  const confirmReactivation = useCallback(async () => {
    const { data } = await confirmAccountReactivation();
    if (data?.requires2FA) {
      return { requires2FA: true };
    }
    return handleAuthSuccess(data);
  }, [handleAuthSuccess]);

  const cancelReactivation = useCallback(async () => {
    try {
      await cancelAccountReactivation();
    } catch {
      // Clearing local state is still useful if the challenge already expired.
    }
  }, []);

  const logout = useCallback(async () => {
    if (sessionActive) {
      try {
        await logoutUser();
      } catch {
        // Session may already be invalid (e.g. after account deletion).
      }
    }

    clearStoredToken();
    setAuthToken(null);
    setSessionActive(false);
    setUser(null);
    syncLanguageWithUser(null);
  }, [sessionActive]);

  const refreshUser = useCallback(async () => {
    const generation = authGenerationRef.current;

    try {
      const { data } = await getMe();
      if (generation !== authGenerationRef.current) return null;
      setUser(data.user);
      setSessionActive(true);
      setLoading(false);
      return data.user;
    } catch {
      if (generation !== authGenerationRef.current) return null;
      setUser(null);
      setSessionActive(false);
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token: sessionActive ? 'session' : null,
      loading,
      isAuthenticated: Boolean(user && sessionActive),
      login,
      verifyTwoFactor,
      confirmReactivation,
      cancelReactivation,
      logout,
      setSession: handleAuthSuccess,
      syncSession,
      updateUser,
      refreshUser,
    }),
    [user, sessionActive, loading, login, verifyTwoFactor, confirmReactivation, cancelReactivation, logout, handleAuthSuccess, syncSession, updateUser, refreshUser]
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
