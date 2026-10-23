"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CONFIG } from "../common";

export interface UserProfile {
  id: string;
  name?: string;
  email: string;
  role: "admin" | "user";
  isBlocked: boolean;
  isFirstTime: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: UserProfile) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate and load session on initial mount / page refresh
  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    const savedUser = localStorage.getItem("admin_user");

    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    setToken(savedToken);

    // Fast initial hydration from localStorage cache
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("Failed to parse cached user:", err);
      }
    }

    // Verify token validity against backend /api/auth/me
    fetch(`${CONFIG.BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${savedToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Session expired or invalid");
        return res.json();
      })
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem("admin_user", JSON.stringify(data.user));
        } else {
          throw new Error("Invalid response");
        }
      })
      .catch((err) => {
        console.warn("Auth session validation failed:", err.message);
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem("admin_token", newToken);
    localStorage.setItem("admin_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setToken(null);
    setUser(null);
    window.location.href = "/admin";
  };

  // Listen for global unauthorized/token expiration events dispatched anywhere in the app
  useEffect(() => {
    const handleUnauthorized = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      const reason = customEvent.detail?.message || "Session expired. Please log in again.";
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      setToken(null);
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = `/admin?error=${encodeURIComponent(reason)}`;
      }
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${CONFIG.BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem("admin_user", JSON.stringify(data.user));
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user && !user.isBlocked),
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * Global helper to trigger automatic logout when any API request receives 401 or 403
 */
export function triggerSessionExpired(message = "Session expired. Please log in again.") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:unauthorized", { detail: { message } }));
  }
}
