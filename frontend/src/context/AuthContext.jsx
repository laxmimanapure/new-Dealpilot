import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dealpilot_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('dealpilot_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('dealpilot_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    setToken(token);
    setUser(user);
    localStorage.setItem('dealpilot_token', token);
    localStorage.setItem('dealpilot_user', JSON.stringify(user));
    return user;
  };

  const signup = async (userData) => {
    const res = await api.post('/auth/signup', userData);
    const { token, user } = res.data;
    setToken(token);
    setUser(user);
    localStorage.setItem('dealpilot_token', token);
    localStorage.setItem('dealpilot_user', JSON.stringify(user));
    return user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('dealpilot_token');
    localStorage.removeItem('dealpilot_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
