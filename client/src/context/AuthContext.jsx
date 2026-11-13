import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthToken, getAuthToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiRequest('/auth/me');
        setManager(res.manager);
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        setAuthToken(null);
        setManager(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (identifier, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    setAuthToken(res.token);
    setManager(res.manager);
    return res;
  };

  const demoLogin = async () => {
    const res = await apiRequest('/auth/demo-login', {
      method: 'POST'
    });
    setAuthToken(res.token);
    setManager(res.manager);
    return res;
  };

  const register = async (userData) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    setAuthToken(res.token);
    setManager(res.manager);
    return res;
  };

  const logout = () => {
    setAuthToken(null);
    setManager(null);
  };

  return (
    <AuthContext.Provider value={{
      manager,
      loading,
      isAuthenticated: !!manager,
      login,
      demoLogin,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
