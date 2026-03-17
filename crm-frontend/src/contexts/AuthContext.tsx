import React from 'react';
import axios from 'axios';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

const API_BASE = 'https://localhost:7047';

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

function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function restoreUserFromToken(token: string): User | null {
  const payload = parseJwt(token);
  if (!payload) return null;

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    return null;
  }

  const stored = localStorage.getItem('currentUser');
  if (stored) {
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }
  return null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (token) return restoreUserFromToken(token);
    return null;
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_BASE}/api/auth/login`,
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
        localStorage.setItem('currentUser', JSON.stringify(mappedUser));
        return true;
      }

      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
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
