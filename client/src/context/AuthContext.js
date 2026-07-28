import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await api.get('/auth/me');
        const u = res.data;
        setUser({ ...u, id: u._id });
      } catch {
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    const u = res.data.user;
    setUser({ ...u, id: u.id || u._id });
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', res.data.token);
    const u = res.data.user;
    setUser({ ...u, id: u.id || u._id });
    return res.data;
  };

  const guruLogin = async (email, password) => {
    const res = await api.post('/auth/guru-login', { email, password });
    localStorage.setItem('token', res.data.token);
    const u = res.data.user;
    setUser({ ...u, id: u.id || u._id });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const isGuru = () => user && ['guru', 'acharya', 'admin'].includes(user.role);
  const isAdmin = () => user && user.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, guruLogin, logout, isGuru, isAdmin, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
