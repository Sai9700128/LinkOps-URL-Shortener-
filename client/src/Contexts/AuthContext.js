import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const userData = authService.getCurrentUser();
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await authService.login(username, password);
    setUser({
      username: response.username,
      email: response.email
    });
    return response;
  };

  const register = async (username, email, password) => {
    const response = await authService.register(username, email, password);
    setUser({
      username: response.username,
      email: response.email
    });
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};