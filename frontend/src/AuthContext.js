import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("nm_user");
    const token  = localStorage.getItem("nm_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("nm_token", token);
    localStorage.setItem("nm_user",  JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("nm_token");
    localStorage.removeItem("nm_user");
    setUser(null);
  };

  const getToken = () => localStorage.getItem("nm_token");

  const authFetch = (url, options = {}) => {
    const token = getToken();
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken, authFetch, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}