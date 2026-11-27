import React, { createContext, useContext, useState } from 'react';
import { authService, getRolesFromToken } from '../api/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  userName: string | null;
  roles: string[];
  isInstructorOrAdmin: boolean;
  login: (username: string, password: string) => Promise<string[]>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function hasAdminOrInstructorRole(roles: string[]): boolean {
  return roles.some((r) => r.toLowerCase() === 'admin' || r.toLowerCase() === 'instructor');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem('user_name'));
  const [roles, setRoles] = useState<string[]>(() =>
    getRolesFromToken(localStorage.getItem('access_token'))
  );

  const login = async (usernameInput: string, passwordInput: string): Promise<string[]> => {
    const data = await authService.login(usernameInput, passwordInput);
    const extractedRoles = getRolesFromToken(data.access_token);
    setToken(data.access_token);
    setUserName(usernameInput);
    setRoles(extractedRoles);
    return extractedRoles;
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUserName(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: Boolean(token),
        userName,
        roles,
        isInstructorOrAdmin: hasAdminOrInstructorRole(roles),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  }
  return context;
};
