// import { createContext, useContext, useState, useEffect } from "react";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const stored = localStorage.getItem("nm_user");
//     const token = localStorage.getItem("nm_token");
//     if (stored && token) {
//       setUser(JSON.parse(stored));
//     }
//     setLoading(false);
//   }, []);

//   const login = (userData, token) => {
//     localStorage.setItem("nm_token", token);
//     localStorage.setItem("nm_user", JSON.stringify(userData));
//     setUser(userData);
//   };

//   const logout = () => {
//     localStorage.removeItem("nm_token");
//     localStorage.removeItem("nm_user");
//     setUser(null);
//   };

//   const getToken = () => localStorage.getItem("nm_token");

//   const authFetch = async (url, options = {}) => {
//     const token = getToken();
//     const res = await fetch(url, {
//       ...options,
//       headers: {
//         "Content-Type": "application/json",
//         ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         ...(options.headers || {}),
//       },
//     });

//     // ✅ FIX: Only auto-logout if a token existed (user was logged in)
//     if (res.status === 401 && token) {
//       logout();
//     }

//     return res;
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout, getToken, authFetch, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   return useContext(AuthContext);
// }

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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
    localStorage.setItem("nm_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("nm_token");
    localStorage.removeItem("nm_user");
    setUser(null);
  };

  const getToken = () => localStorage.getItem("nm_token");

  const authFetch = async (url, options = {}) => {
    const token = getToken();

    // ✅ KEY FIX: Do NOT set Content-Type when sending FormData (file upload).
    // The browser must set it automatically so it includes the multipart boundary.
    // For all other requests (JSON), set Content-Type: application/json as usual.
    const isFormData = options.body instanceof FormData;

    const headers = {
      // Only add JSON content-type if NOT a file upload
      ...(!isFormData && { "Content-Type": "application/json" }),
      // Always attach auth token if available
      ...(token && { Authorization: `Bearer ${token}` }),
      // Allow caller to override/add headers (but NOT Content-Type for FormData)
      ...(options.headers || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    // Auto-logout only if a token existed (user was genuinely logged in)
    if (res.status === 401 && token) {
      logout();
    }

    return res;
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