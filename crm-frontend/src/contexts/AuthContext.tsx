import React from 'react';
import axios from 'axios';
import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children?: ReactNode;
};

interface LoginResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    team: string;
    role: string;
  };
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    const response = await axios.post<LoginResponse>(
      'https://localhost:7047/api/auth/login',
      { email, password }
    );

    const apiUser = response.data.user;

    if (apiUser) {
      const mappedUser: User = {
        id: apiUser.id,
        name: apiUser.fullName,
        email: apiUser.email,
        role: apiUser.role.toLowerCase() === 'admin' ? 'sales' : 'support',
        team: apiUser.team as any,
      };

      setCurrentUser(mappedUser);
      localStorage.setItem('token', response.data.token);
      console.log(`✅ User ${mappedUser.name} logged in successfully`);
      return true;
    }

    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    console.log('👋 User logged out');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        isAuthenticated: currentUser !== null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
