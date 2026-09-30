import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore, setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export const ROLE_HOME = { STUDENT: '/student', INSTITUTION: '/institution', EMPLOYER: '/employer' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const { user: u } = await api.get('/auth/me');
    setUser(u);
    return u;
  }, []);

  // Persistent login: restore the session from the stored token on first load.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    refresh().catch(logout).finally(() => setLoading(false));
  }, [logout, refresh]);

  const login = useCallback(async (email, password, role) => {
    const { token, user: u } = await api.post('/auth/login', { email, password, role });
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const { token, user: u } = await api.post('/auth/register', payload);
    tokenStore.set(token);
    setUser(u);
    return u;
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading, login, register, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
