import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { useTranslation } from 'react-i18next';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
            if (res.data.data.language && ['en', 'am'].includes(res.data.data.language)) {
              i18n.changeLanguage(res.data.data.language);
              localStorage.setItem('language', res.data.data.language);
            }
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      if (newUser.language) {
        i18n.changeLanguage(newUser.language);
        localStorage.setItem('language', newUser.language);
      }
      return newUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const ROLE_ALIASES = {
    SYSTEM_ADMIN: ['SYSTEM_ADMIN', 'admin'],
    admin: ['SYSTEM_ADMIN', 'admin'],
    ZONE_EXPERT: ['ZONE_EXPERT', 'zone_officer'],
    zone_officer: ['ZONE_EXPERT', 'zone_officer'],
    WOREDA_OFFICER: ['WOREDA_OFFICER', 'woreda_officer'],
    woreda_officer: ['WOREDA_OFFICER', 'woreda_officer'],
    KEBELE_OFFICER: ['KEBELE_OFFICER', 'kebele_officer'],
    kebele_officer: ['KEBELE_OFFICER', 'kebele_officer'],
    STOREKEEPER: ['STOREKEEPER', 'store_manager'],
    store_manager: ['STOREKEEPER', 'store_manager']
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'SYSTEM_ADMIN') return true;
    
    return roles.some(r => {
      if (user.role === r) return true;
      if (ROLE_ALIASES[r] && ROLE_ALIASES[r].includes(user.role)) return true;
      return false;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        changeLanguage,
        currentLanguage: i18n.language || 'en',
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
