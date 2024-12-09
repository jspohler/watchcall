import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
}

interface UpdateProfileData {
  username?: string;
  email?: string;
  newPassword?: string;
  currentPassword: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000/api';
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('/user');
        setUser(response.data);
      } catch (err) {
        setUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleError = (err: any) => {
    console.error('Auth error:', err);
    if (err.response?.data?.error) {
      setError(err.response.data.error);
    } else if (err.response?.data?.errors) {
      setError(err.response.data.errors[0]);
    } else {
      setError('An unexpected error occurred');
    }
    throw err;
  };

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('/login', { username, password });
      setUser(response.data.user);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Sending signup request with:', { username, email });
      const response = await axios.post('/signup', 
        { username, email, password },
        { 
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      );
      console.log('Signup response:', response.data);
      setUser(response.data.user);
    } catch (err: any) {
      console.error('Signup error:', err.response || err);
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await axios.post('/logout');
      setUser(null);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.put('/user/profile', data);
      setUser(response.data.user);
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateProfile, error, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 