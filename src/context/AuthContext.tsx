import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (userData: User | { username: string; password: string }) => Promise<boolean>;
  register: (userData: { username: string; email: string; phone: string; password: string }) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData: User | { username: string; password: string }): Promise<boolean> => {
    try {
      let userToStore: User;
      
      if ('id' in userData) {
        userToStore = userData;
      } else {
        userToStore = {
          id: '1',
          username: userData.username,
          email: `${userData.username}@example.com`,
          phone: '+1234567890',
        };
      }
      
      await AsyncStorage.setItem('userToken', 'dummy-token');
      await AsyncStorage.setItem('userData', JSON.stringify(userToStore));
      
      setUser(userToStore);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: { username: string; email: string; phone: string; password: string }): Promise<boolean> => {
    try {
      const newUser: User = {
        id: Date.now().toString(),
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
      };
      
      await AsyncStorage.setItem('userToken', 'dummy-token');
      await AsyncStorage.setItem('userData', JSON.stringify(newUser));
      
      setUser(newUser);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
 	 value={{
	    isAuthenticated,
	    user,
	    isLoading,
	    login,
	    register,
	    logout,
	    updateUser,
  }}
    >
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
